module.exports = (sequelize, DataTypes) => {
  const ActionLog = sequelize.define("ActionLog", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT, // JSON string format
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  // Static method to log a shift change
  ActionLog.logShiftChange = async function (userId, timeIn, timeOut) {
    try {
      const dateOnly = timeIn.split("T")[0]; // get YYYY-MM-DD
      const details = JSON.stringify({
        date: dateOnly,
        timeIn,
        timeOut,
      });

      const actionLog = await ActionLog.create({
        userId,
        action: "Shift Change",
        details,
      });

      console.log("Shift change logged:", actionLog.toJSON());
      return actionLog;
    } catch (error) {
      console.error("Error logging shift change:", error);
      throw error;
    }
  };

  // Static method to approve a shift change
  ActionLog.approveShiftChange = async function (id, AttendanceModel) {
    const transaction = await this.sequelize.transaction();
    
    try {
      const action = await ActionLog.findByPk(id, { transaction });
      if (!action || action.status !== "pending") {
        throw new Error("Pending action not found");
      }

      let parsedDetails;
      try {
        parsedDetails = JSON.parse(action.details);
      } catch (err) {
        throw new Error("Invalid action details format");
      }

      const { date, timeIn, timeOut } = parsedDetails;

      if (!date || !timeIn || !timeOut) {
        throw new Error("Missing time or date in action details");
      }

      // Find the attendance record for this specific date
      const attendance = await AttendanceModel.findOne({
        where: {
          userId: action.userId,
          date,
        },
        transaction
      });

      if (!attendance) {
        throw new Error("Attendance record not found for user/date");
      }

      // Update the attendance record with the new times
      await attendance.update({
        timeIn,
        timeOut,
        totalHours: parseFloat(((new Date(timeOut) - new Date(timeIn)) / (1000 * 60 * 60)).toFixed(2))
      }, { transaction });

      // Update the action log status
      await action.update({ 
        status: "approved",
        timestamp: new Date()
      }, { transaction });

      // Commit the transaction
      await transaction.commit();

      console.log("Attendance updated and action approved successfully");
    } catch (error) {
      // Rollback the transaction if there's an error
      await transaction.rollback();
      console.error("Error in approveShiftChange:", error);
      throw error;
    }
  };

  // Static method to reject a shift change
  ActionLog.rejectShiftChange = async function (id) {
    const action = await ActionLog.findByPk(id);
    if (!action || action.status !== "pending") {
      throw new Error("Pending action not found");
    }

    action.status = "rejected";
    await action.save();
  };

  // Relationship
  ActionLog.associate = (models) => {
    ActionLog.belongsTo(models.Account, { foreignKey: "userId" });
  };

  return ActionLog;
};
