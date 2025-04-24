const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const { Op } = require('sequelize');
const sendEmail = require('_helpers/send-email');
const db = require('_helpers/db');
const Role = require('_helpers/role');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getAllWithPagination,
    getById,
    create,
    update,
    delete: _delete,
    archive,
    unarchive,
    activate,
    deactivate
};

async function getAllWithPagination(page, limit, includeArchived = false) {
    const offset = (page - 1) * limit;
    const where = includeArchived ? { isVerified: true } : { isVerified: true, archived: false };

    const users = await db.Account.findAndCountAll({
        where,
        limit,
        offset
    });

    return {
        totalUsers: users.count,
        totalPages: Math.ceil(users.count / limit),
        currentPage: page,
        users: users.rows.map(x => basicDetails(x))
    };
}

async function authenticate({ email, password, ipAddress }) {
    const account = await db.Account.scope('withHash').findOne({ where: { email } });

    if (!account || !account.isVerified || !(await bcrypt.compare(password, account.passwordHash))) {
        throw 'Email or password is incorrect';
    }

    // Check if account is archived
    if (account.archived) {
        throw 'Account suspended';
    }

    // Check if account is inactive
    if (account.status === 'Inactive') {
        throw 'Account inactive';
    }

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    // save refresh token
    await refreshToken.save();

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);
    const account = await refreshToken.getAccount();

    // Check if account is archived
    if (account.archived) {
        throw 'Account suspended';
    }

    // Check if account is inactive
    if (account.status === 'Inactive') {
        throw 'Account inactive';
    }

    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(account);

    // return basic details and tokens
    return {
        ...basicDetails(account),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }) {
    const refreshToken = await getRefreshToken(token);

    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin) {
    try {
        console.log("Incoming Registration Data:", params);

        // Validate if email is already registered
        const existingAccount = await db.Account.findOne({ where: { email: params.email } });
        if (existingAccount) {
            console.log(" Email already registered:", params.email);
            return await sendAlreadyRegisteredEmail(params.email, origin);
        }

        // Create new account instance
        const account = new db.Account(params);

        // Check if it's the first account (assign admin role)
        const isFirstAccount = (await db.Account.count()) === 0;
        account.role = isFirstAccount ? Role.Admin : Role.User;

        // Generate verification token
        account.verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(" Generated Verification Token:", account.verificationToken);

        // Hash password
        account.passwordHash = await hash(params.password);
        console.log(" Password Hashed Successfully");

        // Save account to database
        await account.save();
        console.log(" Account Saved Successfully");

        // Send verification email
        await sendVerificationEmail(account, origin);
        console.log(" Verification Email Sent");

        return { message: "Registration successful! Please check your email for verification." };
    } catch (error) {
        console.error(" Registration Error:", error); // Log full error details
        throw new Error("Internal Server Error: " + error.message);
    }
}

async function verifyEmail({ token }) {
    const account = await db.Account.findOne({ where: { verificationToken: token } });

    if (!account) throw 'Verification failed';

    account.verified = Date.now();
    account.verificationToken = null;
    await account.save();
}

// Function to resend verification email
async function resendVerification(email) {
    const account = await db.Account.findOne({ where: { email } });
  
    if (!account) throw 'Account not found. Please check the email address.';
  
    const newVerificationToken = generateSixDigitToken();
    account.verificationToken = newVerificationToken;
    await account.save();
  
    // Pass the account and token (instead of origin) to the sendVerificationEmail function
    await sendVerificationEmail(account, true); // Set 'true' to indicate a verification link should be sent
  }
  
  // 6-digit token generator
  function generateSixDigitToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
async function forgotPassword({ email }, origin) {
    const account = await db.Account.findOne({ where: { email } });

    // always return ok response to prevent email enumeration
    if (!account) return;

    // create reset token that expires after 30 minutes
    account.resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    account.resetTokenExpires = new Date(Date.now() + 5 * 60 * 1000);
    await account.save();

    // send email
    await sendPasswordResetEmail(account, origin);
}

async function validateResetToken({ token }) {
    const account = await db.Account.findOne({
        where: {
            resetToken: token,
            resetTokenExpires: { [Op.gt]: Date.now() }
        }
    });

    if (!account) throw 'Invalid token';

    return account;
}

async function resetPassword({ token, password }) {
    const account = await validateResetToken({ token });

    // update password and remove reset token
    account.passwordHash = await hash(password);
    account.passwordReset = Date.now();
    account.resetToken = null;
    await account.save();
}

async function getAll(includeArchived = false) {
    const where = includeArchived ? {} : { archived: false };
    const accounts = await db.Account.findAll({ where });
    return accounts.map(x => basicDetails(x));
}

async function getById(id) {
    const account = await getAccount(id);
    
    // Check if account is archived
    if (account.archived) {
        throw 'Account suspended';
    }
    
    // Check if account is inactive
    if (account.status === 'Inactive') {
        throw 'Account inactive';
    }
    
    return basicDetails(account);
}

async function create(params) {
    // validate
    if (await db.Account.findOne({ where: { email: params.email } })) {
        throw 'Email "' + params.email + '" is already registered';
    }

    const account = new db.Account(params);
    account.verified = Date.now();

    // hash password
    account.passwordHash = await hash(params.password);

    // save account
    await account.save();

    return basicDetails(account);
}

async function update(id, params) {
    const user = await db.Account.findByPk(id);
    if (!user) throw 'User not found';

    // Hash password if updating
    if (params.password) {
        params.passwordHash = await hash(params.password);
    }

    // Remove plain password fields before assigning to user object
    delete params.password;
    delete params.confirmPassword;

    Object.assign(user, params);
    await user.save();
}

async function _delete(id) {
    const account = await getAccount(id);
    await account.destroy();
}

async function archive(id) {
    const account = await getAccount(id);
    account.archived = true;
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

async function unarchive(id) {
    const account = await getAccount(id);
    account.archived = false;
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

async function activate(id) {
    const account = await getAccount(id);
    account.status = 'Active';
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

async function deactivate(id) {
    const account = await getAccount(id);
    account.status = 'Inactive';
    account.updated = new Date();
    await account.save();
    return basicDetails(account);
}

// helper functions

async function getAccount(id) {
    const account = await db.Account.findByPk(id);
    if (!account) throw 'Account not found';
    return account;
}

async function getRefreshToken(token) {
    const refreshToken = await db.RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

async function hash(password) {
    return await bcrypt.hash(password, 10);
}

function generateJwtToken(account) {
    return jwt.sign(
        { sub: account.id, id: account.id, role: account.role },
        config.secret,
        { expiresIn: '20d' }
    );
}

function generateRefreshToken(account, ipAddress) {
    // create a refresh token that expires in 7 days
    return new db.RefreshToken({
        accountId: account.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7*24*60*60*1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account) {
    const { id, title, firstName, lastName, phone, email, role, country, city, postalCode, created, updated, isVerified, status } = account;
    return { id, title, firstName, lastName, phone, email, role, country, city, postalCode, created, updated, isVerified, status };
}

async function sendVerificationEmail(account, origin) {
    let message;
    if (origin) {
        const verifyUrl = `${account.verificationToken}`;
        message = `<p>Here's your verification code to continue signing up, the code will be valid for 5 minutes:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to verify your email address with the <a href="${origin}/account/verify-email">Verify Email</a></p>
                   <p><code>${account.verificationToken}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Sign-up Verification Code',
        html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`
    });
}

async function resendVerification(email, origin) {
    const account = await db.Account.findOne({ where: { email } });

    if (!account) throw new Error('Account not found. Please check the email address.');

    account.verificationToken = generateSixDigitToken(); // generate new token
    await account.save();

    let message;
    if (origin) {
        const verifyUrl = `${account.verificationToken}`;
        message = `<p>Here's your verification code to continue signing up, the code will be valid for 5 minutes:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } else {
        message = `<p>Please use the token below to verify your email address with the <a href="${origin}/account/verify-email">Verify Email</a></p>
                   <p><code>${account.verificationToken}</code></p>`;
    }

    try {
        await sendEmail({
            to: account.email,
            subject: 'Sign-up Verification Email',
            html: `<h4>Verify Email</h4>
                   <p>Thanks for registering!</p>
                   ${message}`
        });
    } catch (error) {
        throw new Error('Failed to send verification email. Please try again.');
    }
}

async function sendAlreadyRegisteredEmail(email, origin) {
    let message;
    if (origin) {
        message = `<p>If you don't know your password please visit the <a href="${origin}/account/forgot-password">forgot password</a> page.</p>`;
    } else {
        message = `<p>If you don't know your password you can reset it via the <code>/account/forgot-password</code> api route.</p>`;
    }

    await sendEmail({
        to: email,
        subject: 'Email Already Registered',
        html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`
    });
}

async function sendPasswordResetEmail(account, origin) {
    let message;
    if (origin) {
        const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
        message = `<p>Please click the below link to reset your password, the link will be valid for 5 minutes:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
    } else {
        message = `<p>Please use the below token to reset your password with the <code>/account/reset-password</code> api route:</p>
                   <p><code>${account.resetToken}</code></p>`;
    }

    await sendEmail({
        to: account.email,
        subject: 'Reset Password Verification Code',
        html: `<h4>Reset Password Email</h4>
               ${message}`
    });
}
