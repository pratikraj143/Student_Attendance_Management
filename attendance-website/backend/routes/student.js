const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// Get student dashboard (student only)
router.get('/dashboard', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }
  const student = await Student.findOne({ userId });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  res.json(student);
});

router.get('/attendance', async (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }
  const student = await Student.findOne({ userId });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  res.json(student.attendance || []);
});
module.exports = router;