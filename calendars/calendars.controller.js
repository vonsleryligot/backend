const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const calendarService = require('../calendars/calendar.service');

// Add Event (Admins only)
router.post('/', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(403).json({ message: "Invalid token" });
    }

    // Ensure the request body contains the necessary fields
    const { title, eventColor, startDate, endDate } = req.body;

    // Validate the necessary fields
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: "Title, Start Date, and End Date are required" });
    }

    // Create event with the necessary data
    const eventData = { title, eventColor, startDate, endDate };

    const newEvent = await calendarService.createEvent(eventData);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: "Error adding calendar event", error: error.message });
  }
});

// Route to get all events (accessible by any authenticated user)
router.get('/', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header
    
    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }
    
    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded) {
      return res.status(403).json({ message: "Invalid token" });
    }
    
    // Fetch the events
    const events = await calendarService.getAllEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Error fetching events", error });
  }
});

module.exports = router;
