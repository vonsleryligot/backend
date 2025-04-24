module.exports = (sequelize, DataTypes) => {
    const Employment = sequelize.define('Employment', {
        accountId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        employmentType: {
            type: DataTypes.STRING,
            allowNull: true
        },
        department: {
            type: DataTypes.STRING,
            allowNull: true
        },
        position: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rank: {
            type: DataTypes.STRING,
            allowNull: true
        },
        rate: {
            type: DataTypes.FLOAT,
            allowNull: true
        },
        bank: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            defaultValue: 'Active',
            allowNull: false
        }
    });

    Employment.associate = (models) => {
        // Define associations here if needed
        Employment.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    };

    // Add hook to sync status with account
    Employment.afterCreate(async (employment, options) => {
        const account = await employment.getAccount();
        if (account) {
            await employment.update({ status: account.status }, { transaction: options.transaction });
        }
    });

    // Add hook to sync status when account is updated
    Employment.afterUpdate(async (employment, options) => {
        const account = await employment.getAccount();
        if (account) {
            await employment.update({ status: account.status }, { transaction: options.transaction });
        }
    });

    return Employment;
};
