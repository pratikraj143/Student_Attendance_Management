const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const StudentSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  roll: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  photo: { type: String },
  approved: { type: Boolean, default: false },
  attendance: [{
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
  }]
}, { timestamps: true });

// Hash password before saving
StudentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare passwords
StudentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Student', StudentSchema);