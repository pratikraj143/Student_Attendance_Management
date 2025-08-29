require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin'); // path to your Admin model

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const existingAdmin = await Admin.findOne({ userId: 'admin' });
  if (existingAdmin) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const newAdmin = new Admin({
    userId: 'admin',
    password: 'admin123', // will be hashed automatically by the pre-save hook
    name: 'Super Admin',
    email: 'superadmin@example.com'
  });

  await newAdmin.save();
  console.log('Admin created successfully');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
});
