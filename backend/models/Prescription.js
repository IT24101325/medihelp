const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medication name is required'],
  },
  dosage: {
    type: String,
    default: '',
  },
  frequency: {
    type: String,
    default: '',
  },
  duration: {
    type: String,
    default: '',
  },
  instructions: {
    type: String,
    default: '',
  },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
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
  medicalRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
  },
  medications: {
    type: [medicationSchema],
    validate: {
      validator: function (v) {
        return v && v.length > 0;
      },
      message: 'At least one medication is required',
    },
  },
  notes: {
    type: String,
    default: '',
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Dispensed'],
    default: 'Active',
  },
  prescriptionImage: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
