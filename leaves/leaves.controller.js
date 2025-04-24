const express = require('express');
const router = express.Router();
const db = require('../_helpers/db'); // Adjust path if necessary
const leaveService = require('./leave.service');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');

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
        dateFiled,
        period,
        requested,
        previousBalance,
        shift,
        reason,
        remarks
      } = req.body;
  
      // Log incoming request data for debugging
      console.log('Received data:', req.body);
  
      if (!employeeId || !action || !type || !units) {
        return res.status(400).json({ message: "Employee ID, action, type, and units are required." });
      }
  
      const newLeave = await leaveService.createLeave({
        employeeId: parseInt(employeeId),
        action,
        type,
        units,
        nextAccrual: nextAccrual || null,
        schedule: schedule || null,
        earned: earned || null,
        approved: approved || null,
        availableBalance: availableBalance || null,
        pendingApproval: pendingApproval || null,
        dateFiled: dateFiled || null,
        period: period || null,
        requested: requested || null,
        previousBalance: previousBalance || null,
        shift: shift || null,
        reason: reason || null,
        remarks: remarks || null
      });
  
      res.status(201).json({ message: 'Leave submitted successfully and pending admin approval', leave: newLeave });
    } catch (error) {
      console.error('Error saving leave data:', error);
      res.status(500).json({ 
        message: 'Error processing leave request', 
        error: error.message || 'Unknown error occurred'
      });
    }
  });  

// Get All Leaves
router.get('/', async (req, res) => {
  try {
    // Check if db is initialized
    if (!db.Leave) {
      console.error('Leave model is not defined in db object');
      return res.status(500).json({ 
        message: 'Database not properly initialized',
        error: 'Leave model not found'
      });
    }
    
    const leaves = await leaveService.getAllLeaves();
    res.status(200).json(leaves);
  } catch (error) {
    console.error('Failed to fetch leaves:', error);
    res.status(500).json({ 
      message: 'Failed to fetch leaves', 
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Get Leave By Employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    // Check if db is initialized
    if (!db.Leave) {
      console.error('Leave model is not defined in db object');
      return res.status(500).json({ 
        message: 'Database not properly initialized',
        error: 'Leave model not found'
      });
    }
    
    const leaves = await leaveService.getLeaveByEmployeeId(req.params.employeeId);
    res.status(200).json(leaves);
  } catch (error) {
    console.error('Failed to fetch employee leaves:', error);
    res.status(500).json({ 
      message: 'Failed to fetch employee leaves', 
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Update Leave
router.put('/:id', async (req, res) => {
  try {
    // Check if db is initialized
    if (!db.Leave) {
      console.error('Leave model is not defined in db object');
      return res.status(500).json({ 
        message: 'Database not properly initialized',
        error: 'Leave model not found'
      });
    }
    
    await leaveService.updateLeave(req.params.id, req.body);
    res.status(200).json({ message: 'Leave updated successfully' });
  } catch (error) {
    console.error('Failed to update leave:', error);
    res.status(500).json({ 
      message: 'Failed to update leave', 
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Delete Leave
router.delete('/:id', async (req, res) => {
  try {
    // Check if db is initialized
    if (!db.Leave) {
      console.error('Leave model is not defined in db object');
      return res.status(500).json({ 
        message: 'Database not properly initialized',
        error: 'Leave model not found'
      });
    }
    
    await leaveService.deleteLeave(req.params.id);
    res.status(200).json({ message: 'Leave deleted successfully' });
  } catch (error) {
    console.error('Failed to delete leave:', error);
    res.status(500).json({ 
      message: 'Failed to delete leave', 
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Admin Routes - Get Pending Leaves
router.get('/pending', authorize(Role.Admin), async (req, res) => {
  try {
    // Check if db is initialized
    if (!db.Leave) {
      console.error('Leave model is not defined in db object');
      return res.status(500).json({ 
        message: 'Database not properly initialized',
        error: 'Leave model not found'
      });
    }
    
    const pendingLeaves = await leaveService.getPendingLeaves();
    res.status(200).json(pendingLeaves);
  } catch (error) {
    console.error('Failed to fetch pending leaves:', error);
    res.status(500).json({ 
      message: 'Failed to fetch pending leaves', 
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Admin Routes - Approve Leave
router.put('/:id/approve', authorize(Role.Admin), async (req, res) => {
  try {
    // Check if db is initialized
    if (!db.Leave) {
      console.error('Leave model is not defined in db object');
      return res.status(500).json({ 
        message: 'Database not properly initialized',
        error: 'Leave model not found'
      });
    }
    
    const { remarks } = req.body;
    const adminId = req.user.id; // Get admin ID from authenticated user
    
    const approvedLeave = await leaveService.approveLeave(req.params.id, adminId, remarks);
    res.status(200).json({ 
      message: 'Leave request approved successfully', 
      leave: approvedLeave 
    });
  } catch (error) {
    console.error('Failed to approve leave request:', error);
    res.status(500).json({ 
      message: 'Failed to approve leave request', 
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Admin Routes - Reject Leave
router.put('/:id/reject', authorize(Role.Admin), async (req, res) => {
  try {
    // Check if db is initialized
    if (!db.Leave) {
      console.error('Leave model is not defined in db object');
      return res.status(500).json({ 
        message: 'Database not properly initialized',
        error: 'Leave model not found'
      });
    }
    
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const adminId = req.user.id; // Get admin ID from authenticated user
    const rejectedLeave = await leaveService.rejectLeave(req.params.id, adminId, rejectionReason);
    
    res.status(200).json({ 
      message: 'Leave request rejected successfully', 
      leave: rejectedLeave 
    });
  } catch (error) {
    console.error('Failed to reject leave request:', error);
    res.status(500).json({ 
      message: 'Failed to reject leave request', 
      error: error.message || 'Unknown error occurred'
    });
  }
});

module.exports = router;
