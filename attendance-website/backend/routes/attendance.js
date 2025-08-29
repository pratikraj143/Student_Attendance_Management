const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get attendance list
router.get('/list', async (req, res) => {
    try {
        // Connect to the attendance_system database
        const db = mongoose.connection.useDb('attendance_system');
        
        // Get the attendance collection
        const attendanceCollection = db.collection('attendance');
        
        // Fetch all attendance records
        const attendanceList = await attendanceCollection.find({}).toArray();
        
        res.json({
            success: true,
            attendance: attendanceList
        });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance data',
            error: error.message
        });
    }
});

module.exports = router; 