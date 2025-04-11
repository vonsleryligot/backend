const express = require('express');
const router = express.Router();
const db = require('../_helpers/db'); // Adjust path if necessary

// Wait for DB initialization
router.use(async (req, res, next) => {
  try {
    await db.ready;
    req.Leave = db.Leave;
    next();
  } catch (err) {
    console.error('DB not ready:', err);
    res.status(500).json({ message: 'Database not initialized' });
  }
});

// Create Leave
router.post('/', async (req, res) => {
    try {
      const {
        employeeId,
        action,
        type,
        units,
        nextAccrual,
        schedule,
        earned,
        approved,
        availableBalance,
        pendingApproval,
      } = req.body;
  
      // Log incoming request data for debugging
      console.log('Received data:', req.body);
  
      if (!employeeId || !action || !type || !units) {
        return res.status(400).json({ message: "Employee ID, action, type, and units are required." });
      }
  
      const newLeave = await req.Leave.create({
        employeeId,
        action,
        type,
        units,
        nextAccrual,
        schedule,
        earned: earned || null,
        approved: approved || null,
        availableBalance: availableBalance || null,
        pendingApproval: pendingApproval || null,
      });
  
      res.status(201).json({ message: 'Leave submitted successfully', leave: newLeave });
    } catch (error) {
      console.error('Error saving leave data:', error);
      res.status(500).json({ message: 'Error processing leave request', error: error.message });
    }
  });  

// Get All Leaves
router.get('/', async (req, res) => {
  try {
    const leaves = await req.Leave.findAll();
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leaves', error });
  }
});

// Get Leave By Employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const leaves = await req.Leave.findAll({ where: { employeeId: req.params.employeeId } });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employee leaves', error });
  }
});

// Update Leave
router.put('/:id', async (req, res) => {
  try {
    await req.Leave.update(req.body, { where: { id: req.params.id } });
    res.status(200).json({ message: 'Leave updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update leave', error });
  }
});

// Delete Leave
router.delete('/:id', async (req, res) => {
  try {
    await req.Leave.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: 'Leave deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete leave', error });
  }
});

module.exports = router;
