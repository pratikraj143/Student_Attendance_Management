const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/authMiddleware');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Teacher = require('../models/Teacher');

// Get list of all teachers (admin only)
router.get('/list', auth, async (req, res) => {
  try {
    if (req.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view teacher list' });
    }

    const teachers = await Teacher.find()
      .select('userId name department courses')
      .sort({ name: 1 });

    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

// Get pending student approvals (teacher only)
router.get('/pending-approvals', auth, async (req, res) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this' });
    }

    const pendingStudents = await Student.find({ approved: false })
      .select('userId name roll course year semester');

    res.json(pendingStudents);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Failed to fetch pending approvals' });
  }
});

// Approve student (teacher only)
router.post('/approve-student/:userId', auth, async (req, res) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can approve students' });
    }

    const student = await Student.findOne({ userId: req.params.userId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.approved = true;
    await student.save();

    res.json({ message: 'Student approved successfully' });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({ message: 'Failed to approve student' });
  }
});

// Get all approved students (teacher only)
router.get('/students', auth, async (req, res) => {
  try {
    if (req.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can access this' });
    }

    const students = await Student.find({ approved: true })
      .select('userId name roll course year semester');

    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Mark attendance (teacher only)
router.post('/mark-attendance', auth, authorizeRoles('teacher'), async (req, res) => {
  try {
    const { course, semester, students } = req.body;
    
    if (!course || !semester || !students) {
      return res.status(400).json({ message: 'Course, semester, and students data are required' });
    }
    
    const attendance = new Attendance({
      course,
      semester,
      date: Date.now(), // Use current timestamp as the date of attendance
      students,
      markedBy: req.userId  // Use req.userId directly
    });
    
    await attendance.save();
    
    // Update individual student records
    for (const studentData of students) {
      await Student.findByIdAndUpdate(
        studentData.student,
        { $push: { attendance: { status: studentData.status, markedBy: req.userId } } }
      );
    }
    
    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
});

module.exports = router;
