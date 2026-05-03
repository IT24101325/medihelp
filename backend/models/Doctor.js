const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  // Optional link to a User account (auto-set on first /doctors/me access)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true,
  },
  licenseNumber: {
    type: String,
    trim: true,
  },
  qualification: {
    type: String,
    trim: true,
  },
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
  },
  hospital: {
    type: String,
    trim: true,
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee must be a positive number'],
  },
  availableDays: {
    type: [String],
    default: [],
  },
  availableTime: {
    type: String,
    default: '',
  },
  profileImage: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Doctor', doctorSchema);
