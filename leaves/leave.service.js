const db = require('../_helpers/db');

// Create a new leave request
async function createLeave(leaveData) {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    // Set initial status to Pending
    const leave = await db.Leave.create({
      ...leaveData,
      status: 'Pending',
      dateFiled: leaveData.dateFiled || new Date()
    });

    return leave;
  } catch (error) {
    console.error('Error in createLeave:', error);
    throw new Error(`Failed to create leave request: ${error.message}`);
  }
}

// Get all leaves with employee details
async function getAllLeaves() {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    const leaves = await db.Leave.findAll({
      include: [
        {
          model: db.Account,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: db.Account,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return leaves;
  } catch (error) {
    console.error('Error in getAllLeaves:', error);
    throw new Error(`Failed to fetch leaves: ${error.message}`);
  }
}

// Get leaves by employee ID
async function getLeaveByEmployeeId(employeeId) {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    const leaves = await db.Leave.findAll({
      where: { employeeId },
      include: [
        {
          model: db.Account,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: db.Account,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return leaves;
  } catch (error) {
    console.error('Error in getLeaveByEmployeeId:', error);
    throw new Error(`Failed to fetch employee leaves: ${error.message}`);
  }
}

// Update leave request
async function updateLeave(id, leaveData) {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    const leave = await db.Leave.findByPk(id);
    if (!leave) {
      throw new Error('Leave request not found');
    }

    await leave.update(leaveData);
    return leave;
  } catch (error) {
    console.error('Error in updateLeave:', error);
    throw new Error(`Failed to update leave: ${error.message}`);
  }
}

// Delete leave request
async function deleteLeave(id) {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    const leave = await db.Leave.findByPk(id);
    if (!leave) {
      throw new Error('Leave request not found');
    }

    await leave.destroy();
    return true;
  } catch (error) {
    console.error('Error in deleteLeave:', error);
    throw new Error(`Failed to delete leave: ${error.message}`);
  }
}

// Get pending leaves
async function getPendingLeaves() {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    const leaves = await db.Leave.findAll({
      where: { status: 'Pending' },
      include: [
        {
          model: db.Account,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return leaves;
  } catch (error) {
    console.error('Error in getPendingLeaves:', error);
    throw new Error(`Failed to fetch pending leaves: ${error.message}`);
  }
}

// Approve leave request
async function approveLeave(id, adminId, remarks) {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    const leave = await db.Leave.findByPk(id);
    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== 'Pending') {
      throw new Error('Leave request is not pending approval');
    }

    await leave.update({
      status: 'Approved',
      approvedBy: adminId,
      approvedAt: new Date(),
      remarks: remarks || null
    });

    return leave;
  } catch (error) {
    console.error('Error in approveLeave:', error);
    throw new Error(`Failed to approve leave: ${error.message}`);
  }
}

// Reject leave request
async function rejectLeave(id, adminId, rejectionReason) {
  try {
    if (!db.Leave) {
      throw new Error('Leave model is not initialized');
    }

    const leave = await db.Leave.findByPk(id);
    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== 'Pending') {
      throw new Error('Leave request is not pending approval');
    }

    await leave.update({
      status: 'Rejected',
      approvedBy: adminId,
      approvedAt: new Date(),
      rejectionReason
    });

    return leave;
  } catch (error) {
    console.error('Error in rejectLeave:', error);
    throw new Error(`Failed to reject leave: ${error.message}`);
  }
}

module.exports = {
  createLeave,
  getAllLeaves,
  getLeaveByEmployeeId,
  updateLeave,
  deleteLeave,
  getPendingLeaves,
  approveLeave,
  rejectLeave
};
