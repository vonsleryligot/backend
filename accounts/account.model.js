const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,   // Ensures ID is always required
            autoIncrement: true, // Automatically increments the ID
            primaryKey: true     // Marks it as the primary key
        },
        title: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false },
        passwordHash: { type: DataTypes.STRING, allowNull: false },
        firstName: { type: DataTypes.STRING, allowNull: false },
        lastName: { type: DataTypes.STRING, allowNull: false },
        role: { type: DataTypes.STRING, allowNull: false },
        country: { type: DataTypes.STRING, allowNull: false },
        city: { type: DataTypes.STRING, allowNull: false },
        postalCode: { type: DataTypes.STRING, allowNull: true },
        phone: { type: DataTypes.STRING, allowNull: true },
        acceptTerms: { type: DataTypes.BOOLEAN },
        verificationToken: { type: DataTypes.STRING },
        verified: { type: DataTypes.DATE },
        resetToken: { type: DataTypes.STRING },
        resetTokenExpires: { type: DataTypes.DATE },
        passwordReset: { type: DataTypes.DATE },
        created: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        updated: { type: DataTypes.DATE },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
        status: { 
            type: DataTypes.ENUM('Active', 'Inactive'), 
            defaultValue: 'Active',
            allowNull: false
        },
        isVerified: {
            type: DataTypes.VIRTUAL,
            get() { return !!(this.verified || this.passwordReset); }
        }
    };

    const options = {
        timestamps: false, 
        defaultScope: {
            attributes: { exclude: ['passwordHash'] }
        },
        scopes: {
            withHash: { attributes: {}, }
        },
        hooks: {
            beforeUpdate: (account) => {
                if (account.changed('archived')) {
                    if (account.archived === true) {
                        account.status = 'Inactive';
                    } else if (account.archived === false) {
                        account.status = 'Active';
                    }
                }
            }
        }
    };

    return sequelize.define('account', attributes, options);
}
