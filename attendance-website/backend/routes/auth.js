const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const { auth } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/students/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // creating a unique filename
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'studentPhoto') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Student Registration
router.post('/register/student',upload.single('image'), async (req, res) => {
  try {
    const { userId, name, roll, course, year, semester, password } = req.body;

    if (!userId  || !name || !roll || !course || !year || !semester  || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
     // Check if an image was uploaded
     if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }
    const existingUser = await Student.findOne({ $or: [{ userId }, { roll }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User ID or Roll Number already exists' });
    }

    const student = new Student({
      userId,
      password,
      name,
      roll,
      course,
      year: parseInt(year),
      semester: parseInt(semester),
      approved: false,
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for teacher approval.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login for all roles
router.post('/login', async (req, res) => {
  try {
    const { userId, password, role } = req.body;
    if (!userId || !password || !role) {
      return res.status(400).json({ message: 'User ID, password and role are required' });
    }

    let user;
    if (role === 'admin') {
      user = await Admin.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      user = user.toObject();
      user.role = 'admin';
    } else if (role === 'teacher') {
      user = await Teacher.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      user = user.toObject();
      user.role = 'teacher';
    } else if (role === 'student') {
      user = await Student.findOne({ userId });
      if (!user) {
        return res.status(404).json({ message: 'Student not found' });
      }
      if (!user.approved) {
        return res.status(403).json({ message: 'Your account is pending approval' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      user = user.toObject();
      user.role = 'student';
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        userId: user.userId,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Add new teacher (no auth required)
router.post('/add-teacher', async (req, res) => {
  try {
    const { userId, password, name, department } = req.body;

    if (!userId || !password || !name || !department) {
      return res.status(400).json({
        message: 'All fields are required',
        received: { userId, password: '***', name, department }
      });
    }

    const existingTeacher = await Teacher.findOne({ userId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'User ID already exists' });
    }

    const teacher = new Teacher({
      userId,
      password,
      name,
      department
    });

    await teacher.save();

    res.status(201).json({
      success: true,
      message: 'Teacher added successfully'
    });
  } catch (error) {
    console.error('Add teacher error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      message: 'Failed to add teacher',
      error: error.message
    });
  }
});

// Remove teacher (admin only)
router.delete('/remove-teacher/:userId', async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndDelete({ userId: req.params.userId });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Teacher removed successfully' });
  } catch (error) {
    console.error('Remove teacher error:', error);
    res.status(500).json({ message: 'Failed to remove teacher' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    if (req.role === 'admin') {
      const admin = await Admin.findById(req.user._id);
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      return res.json({
        _id: admin._id,
        name: admin.name,
        userId: admin.userId,
        role: 'admin',
        email: admin.email
      });
    }

    const user = await Teacher.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      userId: user.userId,
      role: 'teacher',
      email: user.email
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to fetch user data' });
  }
});

module.exports = router;
