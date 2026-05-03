const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res) => {
  try {
    const {
      patientId, doctorId, appointmentId, medicalRecordId,
      medications, notes, issueDate, expiryDate,
    } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ message: 'Patient and doctor are required' });
    }

    if (!medications || medications.length === 0) {
      return res.status(400).json({ message: 'At least one medication is required' });
    }

    // Validate each medication has a name
    for (const med of medications) {
      if (!med.name) {
        return res.status(400).json({ message: 'Each medication must have a name' });
      }
    }

    const prescription = await Prescription.create({
      patientId,
      doctorId,
      appointmentId: appointmentId || null,
      medicalRecordId: medicalRecordId || null,
      medications,
      notes: notes || '',
      issueDate: issueDate ? new Date(issueDate) : Date.now(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');

    res.status(201).json(populatedPrescription);
  } catch (error) {
    console.error('Create prescription error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get patient's own prescriptions
// @route   GET /api/prescriptions/my
// @access  Private
const getMyPrescriptions = async (req, res) => {
  try {
    let query = { patientId: req.user._id };

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        query = { doctorId: doctor._id };
      }
    } else if (req.user.role === 'admin') {
      query = {};
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .sort({ issueDate: -1 });

    // Auto-set status to 'Expired' if expiryDate has passed
    const now = new Date();
    for (const prescription of prescriptions) {
      if (
        prescription.expiryDate &&
        new Date(prescription.expiryDate) < now &&
        prescription.status === 'Active'
      ) {
        prescription.status = 'Expired';
        await prescription.save();
      }
    }

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Get my prescriptions error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get doctor's issued prescriptions
// @route   GET /api/prescriptions/doctor/:id
// @access  Private
const getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctorId: req.params.id })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ issueDate: -1 });

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error('Get doctor prescriptions error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization hospital')
      .populate('appointmentId')
      .populate('medicalRecordId');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Auto-expire check
    if (
      prescription.expiryDate &&
      new Date(prescription.expiryDate) < new Date() &&
      prescription.status === 'Active'
    ) {
      prescription.status = 'Expired';
      await prescription.save();
    }

    res.status(200).json(prescription);
  } catch (error) {
    console.error('Get prescription error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private (Doctor)
const updatePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Validate medications if provided
    if (req.body.medications) {
      if (req.body.medications.length === 0) {
        return res.status(400).json({ message: 'At least one medication is required' });
      }
      for (const med of req.body.medications) {
        if (!med.name) {
          return res.status(400).json({ message: 'Each medication must have a name' });
        }
      }
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');

    res.status(200).json(updatedPrescription);
  } catch (error) {
    console.error('Update prescription error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete prescription (Doctor/Admin only)
// @route   DELETE /api/prescriptions/:id
// @access  Private (Doctor/Admin)
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    await Prescription.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete prescription error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload scanned prescription image
// @route   POST /api/prescriptions/:id/upload
// @access  Private
const uploadPrescriptionImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    prescription.prescriptionImage = `/uploads/${req.file.filename}`;
    await prescription.save();

    res.status(200).json({
      message: 'Prescription image uploaded successfully',
      prescriptionImage: prescription.prescriptionImage,
    });
  } catch (error) {
    console.error('Upload prescription image error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPrescription, getMyPrescriptions, getDoctorPrescriptions,
  getPrescriptionById, updatePrescription, deletePrescription,
  uploadPrescriptionImage,
};
