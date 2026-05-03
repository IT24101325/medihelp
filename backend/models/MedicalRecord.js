const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required'],
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
  },
  symptoms: {
    type: [String],
    default: [],
  },
  treatment: {
    type: String,
    default: '',
  },
  labResults: {
    type: String,
    default: '',
  },
  attachments: {
    type: [String],
    default: [],
  },
  bloodPressure: {
    type: String,
    default: '',
  },
  temperature: {
    type: String,
    default: '',
  },
  weight: {
    type: Number,
  },
  height: {
    type: Number,
  },
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
  },
  followUpDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
