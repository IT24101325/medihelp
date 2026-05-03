const Doctor = require('../models/Doctor');

// @desc    Create a new doctor
// @route   POST /api/doctors
// @access  Private (Admin only)
const createDoctor = async (req, res) => {
  try {
    const {
      name, specialization, qualification, experience, hospital,
      consultationFee, availableDays, availableTime, bio,
    } = req.body;

    if (!name || !specialization) {
      return res.status(400).json({ message: 'Name and specialization are required' });
    }

    if (consultationFee !== undefined && consultationFee < 0) {
      return res.status(400).json({ message: 'Consultation fee must be a positive number' });
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      qualification: qualification || '',
      experience: experience || 0,
      hospital: hospital || '',
      consultationFee: consultationFee || 0,
      availableDays: availableDays || [],
      availableTime: availableTime || '',
      bio: bio || '',
    });

    res.status(201).json(doctor);
  } catch (error) {
    console.error('Create doctor error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all active doctors (with optional specialization filter)
// @route   GET /api/doctors
// @access  Private
const getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    const filter = { isActive: true };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }

    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id
// @access  Private
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json(doctor);
  } catch (error) {
    console.error('Get doctor error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update doctor details
// @route   PUT /api/doctors/:id
// @access  Private (Admin only)
const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (req.body.consultationFee !== undefined && req.body.consultationFee < 0) {
      return res.status(400).json({ message: 'Consultation fee must be a positive number' });
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedDoctor);
  } catch (error) {
    console.error('Update doctor error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Soft delete doctor (set isActive: false)
// @route   DELETE /api/doctors/:id
// @access  Private (Admin only)
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isActive = false;
    await doctor.save();

    res.status(200).json({ message: 'Doctor deactivated successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload doctor profile image
// @route   POST /api/doctors/:id/upload-image
// @access  Private (Admin only)
const uploadDoctorImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.profileImage = `/uploads/${req.file.filename}`;
    await doctor.save();

    res.status(200).json({
      message: 'Doctor image uploaded successfully',
      profileImage: doctor.profileImage,
    });
  } catch (error) {
    console.error('Upload doctor image error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper: find doctor profile for a user (by userId first, then name fallback)
const findMyProfile = async (user) => {
  // 1. Fastest path: already linked by userId
  let doctor = await Doctor.findOne({ userId: user._id, isActive: true });
  if (doctor) return doctor;

  // 2. Name-matching fallback
  const cleanName = (n) => n.toLowerCase().replace(/^dr\.\s*/, '').trim();
  const targetName = cleanName(user.name);
  const allDoctors = await Doctor.find({ isActive: true });

  // 2a. Strict equality
  doctor = allDoctors.find((d) => cleanName(d.name) === targetName) || null;

  // 2b. Partial / substring match (handles middle initials, extra spaces, etc.)
  if (!doctor) {
    doctor = allDoctors.find((d) => {
      const docName = cleanName(d.name);
      return docName.includes(targetName) || targetName.includes(docName);
    }) || null;
  }

  if (doctor) {
    // Auto-link so future calls skip name matching entirely
    doctor.userId = user._id;
    await doctor.save();
  }

  return doctor;
};

// @desc    Get doctor profile for the logged-in doctor user
// @route   GET /api/doctors/me
// @access  Private (Doctor or Admin)
const getMyDoctorProfile = async (req, res) => {
  try {
    // Diagnostic log — remove after profile linking is confirmed working
    const allDoctors = await Doctor.find({ isActive: true });
    console.log('[/doctors/me] User name:', req.user.name);
    console.log('[/doctors/me] Doctor names in DB:', allDoctors.map((d) => d.name));

    const doctor = await findMyProfile(req.user);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found. Please contact admin to link your account.' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    console.error('Get my doctor profile error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update doctor profile for the logged-in doctor user
// @route   PUT /api/doctors/me
// @access  Private (Doctor or Admin)
const updateMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await findMyProfile(req.user);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found. Please contact admin to link your account.' });
    }

    const allowedFields = [
      'availableDays', 'availableTime', 'bio', 'consultationFee',
      'specialization', 'qualification', 'experience', 'hospital', 'name',
    ];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedDoctor);
  } catch (error) {
    console.error('Update my doctor profile error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createDoctor, getDoctors, getDoctorById, updateDoctor, deleteDoctor,
  uploadDoctorImage, getMyDoctorProfile, updateMyDoctorProfile,
};
