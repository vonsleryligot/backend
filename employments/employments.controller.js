const express = require('express');
const router = express.Router();
const db = require('_helpers/db');
const employmentService = require('../employments/employment.service');

// GET /employments - Get all employment records
async function getAll(req, res, next) {
    try {
        console.log('Fetching all employment records...');
        const data = await employmentService.getAll();
        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No employment records found' });
        }
        console.log('Data fetched:', data);
        res.json(data);
    } catch (err) {
        console.error('Error fetching employment records:', err);
        res.status(500).json({ message: 'Error fetching employment records', error: err.message });
        next(err);
    }
}

// GET /employments/:id - Get an employment record by ID
async function getById(req, res, next) {
    try {
        const { id } = req.params;
        const employment = await employmentService.getById(id);

        if (!employment) {
            return res.status(404).json({ message: 'Employment record not found' });
        }

        res.json(employment);
    } catch (err) {
        console.error('Error fetching employment record by ID:', err);
        res.status(500).json({ message: 'Error fetching employment record by ID', error: err.message });
        next(err);
    }
}

// POST /employments - Create a new employment record
async function create(req, res, next) {
    try {
        const { accountId, employmentType, department, rank, rate, bank, position } = req.body;

        // Log the received data to help diagnose issues
        console.log('Received data:', req.body);

        // Ensure all required fields are provided
        if (!accountId || !employmentType || !department || !status || !rank || !rate || !bank || !position) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newEmployment = await employmentService.create(req.body);
        res.status(201).json(newEmployment);
    } catch (err) {
        console.error('Error creating employment record:', err);
        next(err);
    }
}

// PUT /employments/:id - Update an existing employment record
async function update(req, res, next) {
    try {
        const { id } = req.params;
        const employmentId = parseInt(id, 10);

        if (isNaN(employmentId)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        // Ensure the employment record exists
        const employment = await db.Employment.findOne({
            where: { id: employmentId }
        });

        if (!employment) {
            return res.status(404).json({ message: 'Employment record not found' });
        }

        const updatedData = {
            employmentType: req.body.employmentType || employment.employmentType,
            department: req.body.department || employment.department,
            rank: req.body.rank || employment.rank,
            position: req.body.position || employment.position,
            rate: req.body.rate || employment.rate,
            bank: req.body.bank || employment.bank
        };

        // Update the employment record
        await employment.update(updatedData);

        res.json({ message: 'Employment record updated successfully', employment });
    } catch (err) {
        console.error('Error updating employment record:', err);
        next(err);
    }
}

// DELETE /employments/:id - Delete an employment record
async function remove(req, res, next) {
    try {
        await employmentService.remove(req.params.id);
        res.json({ message: 'Employment record deleted successfully' });
    } catch (err) {
        console.error('Error deleting employment record:', err);
        next(err);
    }
}

// Archive Employment - PATCH /employments/:id/archive
async function archiveEmployment(req, res, next) {
    try {
        const updatedEmployment = await employmentService.update(req.params.id, { status: 'archived' });
        res.json({ message: 'Employment archived', employment: updatedEmployment });
    } catch (err) {
        console.error('Error archiving employment record:', err);
        next(err);
    }
}

// Unarchive Employment - PATCH /employments/:id/unarchive
async function unarchiveEmployment(req, res, next) {
    try {
        const updatedEmployment = await employmentService.update(req.params.id, { status: 'Active' });
        res.json({ message: 'Employment unarchived', employment: updatedEmployment });
    } catch (err) {
        console.error('Error unarchiving employment record:', err);
        next(err);
    }
}

// GET /employments/account/:accountId - Get employment record by accountId
async function getByAccountId(req, res, next) {
    try {
        const { accountId } = req.params;
        const employment = await employmentService.getByAccountId(accountId);

        if (!employment) {
            return res.status(404).json({ message: 'Employment record not found for this accountId' });
        }

        res.json(employment);
    } catch (err) {
        console.error('Error fetching employment by accountId:', err);
        res.status(500).json({ message: 'Error fetching employment by accountId', error: err.message });
        next(err);
    }
}

// Routes
router.get('/account/:accountId', getByAccountId); // Get employment record by accountId
router.get('/', getAll); // Get all employment records
router.get('/:id', getById); // Get a single employment record by ID
router.post('/', create); // Create a new employment record
router.put('/:id', update); // Update an existing employment record
router.delete('/:id', remove); // Delete an employment record
router.patch('/:id/archive', archiveEmployment); // Archive an employment record
router.patch('/:id/unarchive', unarchiveEmployment); // Unarchive an employment record

module.exports = router;