const db = require('_helpers/db');
const Calendar = db.Calendar;


async function getAllEvents() {
  try {
    await db.ready;
    const events = await db.Calendar.findAll();
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Error fetching events: " + error.message);
  }
}

async function getEventById(id) {
  await db.ready;
  return await db.Calendar.findByPk(id);
}

async function createEvent(eventData) {
  try {
    await db.ready;
    console.log("Event Data being inserted:", eventData);
    const newEvent = await db.Calendar.create(eventData); // direct access
    return newEvent;
  } catch (error) {
    console.error("Error creating event:", error);
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => err.message);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    } else {
      throw new Error("Error creating event: " + error.message);
    }
  }
}
  
async function updateEvent(id, eventData) {
  try {
    const event = await Calendar.findByPk(id);
    if (!event) {
      throw new Error("Event not found");
    }

    const updatedEvent = await event.update(eventData);
    return updatedEvent;
  } catch (error) {
    console.error("Failed to update event:", error.message);
    throw error;
  }
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
