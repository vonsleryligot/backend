module.exports = (sequelize, DataTypes) => {
    const Leave = sequelize.define('Leave', {
      employeeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
        units: {
            type: DataTypes.STRING,
            allowNull: true,
        },
      nextAccrual: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      schedule: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      earned: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      approved: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      availableBalance: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pendingApproval: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dateFiled: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      period: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requested: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      previousBalance: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      shift: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paid: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    }, {
      tableName: 'leaves',
      timestamps: true,
    });
  
    return Leave;
  };
  