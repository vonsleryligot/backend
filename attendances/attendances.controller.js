const express = require("express");
const router = express.Router();
const attendanceService = require("../attendances/attendance.service");
const Attendance = require("../attendances/attendance.model"); 
const db = require("_helpers/db");  


router.post("/", async (req, res) => {
  try {
    console.log("Received attendance payload:", req.body);

    if (!req.body.userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const attendance = await attendanceService.recordAttendance(req.body);
    res.status(201).json({ message: "Attendance recorded successfully", data: attendance });

  } catch (error) {
    console.error("Failed to record attendance:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all attendances (Optional: Add user filter)
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query; // Allow filtering by user ID
    const attendances = await attendanceService.getAllAttendances(userId);
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /attendances/absents?userId=1&startDate=2025-04-01&endDate=2025-04-16
router.get("/absents", async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const absents = await attendanceService.getAbsentDates({ userId, startDate, endDate });
    res.json({ absents });
  } catch (error) {
    console.error("Failed to fetch absents:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get attendance by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await attendanceService.getAttendanceById(id);
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Attendance and Log Changes
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log("Updating attendance ID:", id, "with data:", updates);

    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found!" });
    }

    console.log("Attendance record found:", attendance.toJSON());

    // Format time correctly
    const formattedUpdates = {
      ...updates,
      timeIn: updates.timeIn ? new Date(`${updates.timeIn}:00Z`) : null,
      timeOut: updates.timeOut ? new Date(`${updates.timeOut}:00Z`) : null,
    };

    // Temporarily merge updated values into the attendance object to simulate the result
    const simulated = {
      ...attendance.toJSON(),
      ...formattedUpdates,
    };

    //  Recalculate totalHours if timeIn and timeOut are present
    if (simulated.timeIn && simulated.timeOut) {
      const diffMs = new Date(simulated.timeOut).getTime() - new Date(simulated.timeIn).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      formattedUpdates.totalHours = parseFloat(diffHours.toFixed(2));
    }

    // Track changes in AttendanceLog
    const logEntries = [];
    for (const key of Object.keys(formattedUpdates)) {
      if (formattedUpdates[key]?.toString() !== attendance[key]?.toString()) {
        logEntries.push({
          attendanceId: attendance.id,
          userId: req.user.id, // Assuming user is authenticated
          fieldChanged: key,
          oldValue: attendance[key] ? attendance[key].toString() : null,
          newValue: formattedUpdates[key] ? formattedUpdates[key].toString() : null,
        });
      }
    }

    await attendance.update(formattedUpdates);

    if (logEntries.length > 0) {
      await AttendanceLog.bulkCreate(logEntries);
    }

    res.json({ message: "Attendance updated successfully", data: attendance });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;