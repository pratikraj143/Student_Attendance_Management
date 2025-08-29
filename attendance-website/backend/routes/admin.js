const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

// Add new teacher (no authorization)
router.post('/teachers', async (req, res) => {
  try {
    const { userId, password, name, department } = req.body;
    
    // Validate input fields
    if (!userId || !password || !name || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if teacher with same userId already exists
    const existingTeacher = await Teacher.findOne({ userId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'User ID already exists' });
    }
    
    // Create a new teacher
    const teacher = new Teacher({
      userId,
      password,
      name,
      department
    });
    
    // Save the teacher to the database
    await teacher.save();
    
    res.status(201).json({ message: 'Teacher added successfully', teacher });
  } catch (error) {
    res.status(500).json({ message: 'Error adding teacher', error: error.message });
  }
});

// Get all teachers (no authorization)
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().select('-password -__v');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
});

module.exports = router;
