const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');

// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private (Doctor/Admin)
const createMedicalRecord = async (req, res) => {
  try {
    const {
      patientId, doctorId, appointmentId, diagnosis, symptoms,
      treatment, labResults, bloodPressure, temperature,
      weight, height, visitDate, followUpDate,
    } = req.body;

    if (!patientId || !doctorId || !diagnosis || !visitDate) {
      return res.status(400).json({
        message: 'Patient, doctor, diagnosis, and visit date are required',
      });
    }

    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      diagnosis,
      symptoms: symptoms || [],
      treatment: treatment || '',
      labResults: labResults || '',
      bloodPressure: bloodPressure || '',
      temperature: temperature || '',
      weight: weight || null,
      height: height || null,
      visitDate: new Date(visitDate),
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    });

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');

    res.status(201).json(populatedRecord);
  } catch (error) {
    console.error('Create medical record error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all records for a patient
// @route   GET /api/medical-records/patient/:id
// @access  Private (Patient themselves or Doctor/Admin)
const getPatientRecords = async (req, res) => {
  try {
    // Only allow patient themselves, or admin/doctor
    if (
      req.params.id !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'doctor'
    ) {
      return res.status(403).json({ message: 'Not authorized to view these records' });
    }

    const records = await MedicalRecord.find({ patientId: req.params.id })
      .populate('doctorId', 'name specialization')
      .populate('appointmentId')
      .sort({ visitDate: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error('Get patient records error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Patient views own records
// @route   GET /api/medical-records/my
// @access  Private
const getMyRecords = async (req, res) => {
  try {
    let query = { patientId: req.user._id };

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        query = { doctorId: doctor._id };
      }
    } else if (req.user.role === 'admin') {
      query = {}; // Admins see everything
    }

    const records = await MedicalRecord.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId')
      .sort({ visitDate: -1 });

    res.status(200).json(records);
  } catch (error) {
    console.error('Get my records error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single record
// @route   GET /api/medical-records/:id
// @access  Private
const getRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate({
        path: 'doctorId',
        select: 'name specialization hospital userId',
      })
      .populate('appointmentId');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check authorization
    if (
      record.patientId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      req.user.role !== 'doctor'
    ) {
      return res.status(403).json({ message: 'Not authorized to view this record' });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error('Get record error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update record
// @route   PUT /api/medical-records/:id
// @access  Private (Doctor/Admin)
const updateRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check authorization: only the doctor who created it or an admin can update
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || record.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this record' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this record' });
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');

    res.status(200).json(updatedRecord);
  } catch (error) {
    console.error('Update record error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete record (Admin only)
// @route   DELETE /api/medical-records/:id
// @access  Private (Admin)
const deleteRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check authorization: only the doctor who created it can delete (admins were restricted by previous request)
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || record.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this record' });
      }
    } else {
      // Admin or others are not authorized to delete medical records anymore
      return res.status(403).json({ message: 'Not authorized to delete medical records' });
    }

    await MedicalRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload attachment file
// @route   POST /api/medical-records/:id/attach
// @access  Private (Doctor/Admin)
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    record.attachments.push(`/uploads/${req.file.filename}`);
    await record.save();

    res.status(200).json({
      message: 'Attachment uploaded successfully',
      attachments: record.attachments,
    });
  } catch (error) {
    console.error('Upload attachment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createMedicalRecord, getPatientRecords, getMyRecords,
  getRecordById, updateRecord, deleteRecord, uploadAttachment,
};
