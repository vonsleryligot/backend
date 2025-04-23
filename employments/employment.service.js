    // services/employment.service.js
    const db = require('_helpers/db');
    const Employment = db.Employment; // Import the Employment model

    // GET /employments - Get all employment records
    async function getAll() {
        try {
            const records = await db.Employment.findAll(); // Modify according to your ORM
            return records;
        } catch (error) {
            console.error('Detailed error in getAll service:', error);
            throw error; // Rethrow to propagate the error to the controller
        }
    }

    // GET /employments/:id - Get a single employment record by ID
    async function getById(id) {
        try {
            return await db.Employment.findByPk(id, {  // Use db.Employment instead of Employment
                include: [{ model: db.Account, as: 'account' }] // Include associated account data
            });
        } catch (err) {
            console.error('Detailed error in getById service:', err);
            throw new Error('Error fetching employment record');
        }
    }

    // Create a new employment record
    async function create(employmentData) {
        try {
            // Create a new employment record using the provided data
            const newEmployment = await db.Employment.create(employmentData);
            return newEmployment;
        } catch (error) {
            console.error('Error creating employment record:', error);
            throw new Error('Error creating employment record');
        }
    }

    // Inside employmentService.js
    async function update(id, updatedData) {
        try {
            const employment = await db.Employment.findOne({ where: { id } });

            if (!employment) {
                throw new Error('Employment not found');
            }

            // Update the employment record
            await employment.update(updatedData);
            return employment;
        } catch (error) {
            throw error;
        }
    }


    // Delete an employment record
    async function remove(id) {
        try {
            const employment = await Employment.findByPk(id);
            if (!employment) {
                throw new Error('Employment record not found');
            }
            return await employment.destroy();
        } catch (err) {
            throw new Error('Error deleting employment record');
        }
    }

    // Create or update employment by accountId
    async function createOrUpdate(data) {
        const { accountId, employmentType, department, rank, rate, bank, position } = data;

        // Check if employment already exists for the account
        let employment = await db.Employment.findOne({ where: { accountId } });

        if (employment) {
            // Update existing employment
            await employment.update({ employmentType, department, rank, rate, bank, position });
            return employment;
        } else {
            // Create new employment
            return await db.Employment.create({ accountId, employmentType, department, rank, rate, bank, position });
        }
    }

    // Get employment by accountId
    async function getByAccountId(accountId) {
        // Assuming you are using Sequelize, replace with the appropriate method to fetch one record
        return await db.Employment.findOne({
            where: { accountId }
        });
    }

    module.exports = {
        getAll,
        getById,
        create,
        update,
        remove,
        createOrUpdate,
        getByAccountId
    };
