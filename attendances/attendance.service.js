const db = require("../_helpers/db");
const { Op } = require("sequelize");

module.exports = {
  recordAttendance,
  updateAttendance,
  getAllAttendances,
  getAttendanceById,
  getAbsentDates,
};

async function recordAttendance(data) {
  try {
    const { userId, imageId, shifts, time } = data;
    if (!userId || !imageId || !shifts || !time) {
      throw new Error("Missing required fields: userId, imageId, shifts, or time.");
    }

    const timeObj = new Date(time);
    const dateOnly = timeObj.toISOString().split("T")[0];

    // Find existing attendance for today with no timeOut
    let attendance = await db.Attendance.findOne({
      where: { userId, shifts, date: dateOnly, timeOut: null },
      order: [["timeIn", "DESC"]],
    });

    if (!attendance) {
      // Create new time-in
      attendance = await db.Attendance.create({
        userId,
        imageId,
        shifts,
        date: dateOnly,
        timeIn: timeObj,
        totalHours: 0.0,
      });
    } else {
      // Update time-out and compute total hours
      if (attendance.timeIn) {
        const timeInDate = new Date(attendance.timeIn);
        const timeOutDate = new Date(timeObj);
        const hoursWorked = (timeOutDate - timeInDate) / (1000 * 60 * 60);
        attendance.totalHours = parseFloat(hoursWorked.toFixed(2));
      } else {
        attendance.totalHours = 0.0;
      }

      attendance.timeOut = timeObj;
      attendance.timeOutImageId = imageId;

      await attendance.save();
    }

    return attendance;
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw error;
  }
}

async function updateAttendance(id, updates) {
  try {
    const attendance = await db.Attendance.findByPk(id);
    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    const logs = [];

    // Track changed fields
    ["timeIn", "timeOut", "totalHours"].forEach((field) => {
      if (updates[field] !== undefined && updates[field] !== attendance[field]) {
        logs.push({
          attendanceId: id,
          userId: attendance.userId,
          fieldChanged: field,
          oldValue: attendance[field] ? attendance[field].toString() : null,
          newValue: updates[field] ? updates[field].toString() : null,
        });
      }
    });

    await attendance.update(updates);

    if (logs.length > 0 && db.AttendanceLog) {
      await db.AttendanceLog.bulkCreate(logs);
    }

    return attendance;
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw error;
  }
}

async function getAllAttendances(userId = null) {
  const whereCondition = userId ? { userId } : {};
  return await db.Attendance.findAll({ where: whereCondition });
}

async function getAttendanceById(id) {
  return await db.Attendance.findByPk(id, {
    include: db.Upload,
  });
}

// ADD THIS FUNCTION
async function getAbsentDates({ userId, startDate, endDate }) {
  if (!userId || !startDate || !endDate) {
    throw new Error("Missing required fields: userId, startDate, or endDate");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Generate working days list (excluding weekends)
  const workingDates = [];
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      workingDates.push(current.toISOString().split("T")[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  // Get all attendance records for that user in range
  const records = await db.Attendance.findAll({
    where: {
      userId,
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
    attributes: ["date"],
  });

  const attendedDates = records.map((r) => r.date.toISOString().split("T")[0]);

  // Find dates in workingDates that are not in attendedDates
  const absentDates = workingDates.filter((date) => !attendedDates.includes(date));

  return absentDates;

}