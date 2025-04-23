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
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Active' // or whatever default status you need
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
        position: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    Employment.associate = (models) => {
        // Define associations here if needed
        Employment.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    };

    return Employment;
};
