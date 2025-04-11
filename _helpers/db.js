const config = require("../config.json");
const mysql = require("mysql2/promise");
const { Sequelize, DataTypes, Op } = require("sequelize");

const db = {}; // Initialize db object

async function initialize() {
    try {
        const { host, port, user, password, database } = config.database;

        // Ensure database exists
        const connection = await mysql.createConnection({ host, port, user, password });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        await connection.end();

        // Initialize Sequelize
        const sequelize = new Sequelize(database, user, password, {
            host,
            dialect: "mysql",
            logging: console.log, // Debugging logs
        });

        // Test DB Connection
        await sequelize.authenticate();
        console.log("Database connection established successfully.");

        // Attach Sequelize instance to db object
        db.sequelize = sequelize;
        db.Op = Op; // Export Op for use in services

        // Load models
        db.Upload = require("../upload/upload.model")(sequelize, DataTypes);
        db.Account = require("../accounts/account.model")(sequelize, DataTypes);
        db.RefreshToken = require("../accounts/refresh-token.model")(sequelize, DataTypes);
        db.ProfileUpload = require("../upload/profile-uploads.model")(sequelize, DataTypes);
        db.Attendance = require("../attendances/attendance.model")(sequelize, DataTypes);
        db.ActionLog = require("../attendances/action_log.model")(sequelize, DataTypes); 
        db.Payslip = require("../payslips/payslip.model")(sequelize, DataTypes);
        db.Leave = require("../leaves/leave.model")(sequelize, DataTypes);
        db.Calendar = require("../calendars/calendar.model")(sequelize, DataTypes);

        console.log("Loaded Models:", Object.keys(db));

        // Define relationships
        db.Account.hasMany(db.RefreshToken, { onDelete: "CASCADE" });
        db.RefreshToken.belongsTo(db.Account);

        db.Account.hasOne(db.ProfileUpload, { onDelete: "CASCADE" });
        db.ProfileUpload.belongsTo(db.Account);

        db.Attendance.belongsTo(db.Upload, { foreignKey: 'uploadId' });
        db.Upload.hasMany(db.Attendance, { foreignKey: 'uploadId' });

        //  Add Relationship between ActionLog and Account
        db.ActionLog.belongsTo(db.Account, { foreignKey: "userId" });
        db.Account.hasMany(db.ActionLog, { foreignKey: "userId" });

        db.Account.hasMany(db.Calendar, { foreignKey: 'userId' });
        db.Calendar.belongsTo(db.Account, { foreignKey: 'userId' });

        // Sync models with database
        await sequelize.sync({ alter: true }).then(() => {
            console.log("Database & tables synchronized.");
        }).catch((err) => {
            console.error("Error syncing database:", err);
        });
        
        // Return the db object so it can be used in other files
        return db;
    } catch (error) {
        console.error("Database initialization error:", error);
        throw error;
    }
}

Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Create a `ready` Promise that resolves when initialization is complete
db.ready = initialize();

module.exports = db;
