const db = require("../_helpers/db");
const { Calendar } = require('../calendars/calendar.model'); // Assuming the models are in the 'models' directory


async function getAllEvents() {
    try {
      const events = await Calendar.findAll(); // Fetch all events
      return events;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Error fetching events: " + error.message);
    }
  }

async function getEventById(id) {
  return await Calendar.findByPk(id);
}

async function createEvent(eventData) {
    try {
      console.log("Event Data being inserted:", eventData); // Debugging log
      const newEvent = await Calendar.create(eventData); // Correctly call the model's `create` method
      return newEvent;
    } catch (error) {
      console.error("Error creating event:", error); // Debugging error
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(err => err.message);
        throw new Error(`Validation failed: ${messages.join(', ')}`);
      } else {
        throw new Error("Error creating event: " + error.message);
      }
    }
  }
  
async function updateEvent(id, eventData) {
  const event = await Calendar.findByPk(id);
  if (!event) throw new Error("Event not found");

  return await event.update(eventData);
}

async function deleteEvent(id) {
  const event = await Calendar.findByPk(id);
  if (!event) throw new Error("Event not found");

  return await event.destroy();
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
