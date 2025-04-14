module.exports = (sequelize, DataTypes) => {
    const Calendar = sequelize.define('Calendar', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: "Title is required"
          },
          notEmpty: {
            msg: "Title cannot be empty"
          }
        }
      },
      eventColor: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATEONLY, // DATEONLY for date without time
        allowNull: false,
        validate: {
          isDate: {
            msg: "Start Date must be a valid date"
          },
        }
      },
      endDate: {
        type: DataTypes.DATEONLY, // DATEONLY for date without time
        allowNull: false,
        validate: {
          isDate: {
            msg: "End Date must be a valid date"
          },
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
    }, {
      timestamps: true, // Enable createdAt and updatedAt
    });
  
    return Calendar;
  };
  