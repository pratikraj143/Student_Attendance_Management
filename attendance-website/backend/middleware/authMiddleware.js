const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');

const auth = async (req, res, next) => {
  try {
    
    if (!req.role) throw new Error('Authentication required'); // Check if role exists

    let user;
    switch (req.role) {
      case 'student':
        user = await Student.findOne({ _id: req.userId }); // You can use req.userId, or any other identifier
        break;
      case 'teacher':
        user = await Teacher.findOne({ _id: req.userId });
        break;
      case 'admin':
        user = await Admin.findOne({ _id: req.userId });
        break;
      default:
        throw new Error('Invalid user role');
    }

    if (!user) throw new Error('User not found');
    
    req.user = user; // Attach user to the request
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate', error: error.message });
  }
};

// Authorization middleware to check if the user has the required role
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    next();
  };
};

module.exports = { auth, authorizeRoles };
