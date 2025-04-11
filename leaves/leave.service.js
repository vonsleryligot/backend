const Leave = require('../leaves/leave.model');

const createLeave = async (leaveData) => {
    try {
      const leave = await Leave.create(leaveData);
      return leave;
    } catch (error) {
      console.error("Error saving leave data:", error);
      throw error;  // Propagate the error
    }
  };
  

const getAllLeaves = async () => {
  try {
    return await Leave.findAll();
  } catch (error) {
    console.error('Error fetching all leaves:', error);
    throw new Error('Error fetching all leaves');
  }
};

const getLeaveByEmployeeId = async (employeeId) => {
  try {
    return await Leave.findAll({ where: { employeeId } });
  } catch (error) {
    console.error('Error fetching leaves for employee:', error);
    throw new Error('Error fetching leaves for employee');
  }
};

const updateLeave = async (id, data) => {
  try {
    return await Leave.update(data, { where: { id } });
  } catch (error) {
    console.error('Error updating leave:', error);
    throw new Error('Error updating leave');
  }
};

const deleteLeave = async (id) => {
  try {
    return await Leave.destroy({ where: { id } });
  } catch (error) {
    console.error('Error deleting leave:', error);
    throw new Error('Error deleting leave');
  }
};

module.exports = {
  createLeave,
  getAllLeaves,
  getLeaveByEmployeeId,
  updateLeave,
  deleteLeave,
};
