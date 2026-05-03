const express = require('express');
const router = express.Router();
const {
  registerPatient, registerDoctor, loginUser, getMe,
  approveDoctor, rejectDoctor, getPendingDoctors,
  updateProfile, uploadAvatar, getPatients, getAllUsers,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.post('/register/patient', registerPatient);
router.post('/register/doctor', registerDoctor);
router.post('/login', loginUser);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.get('/patients', protect, authorize('doctor', 'admin'), getPatients);
router.get('/users', protect, adminOnly, getAllUsers);

// Admin only: Approval flow
router.get('/pending-doctors', protect, adminOnly, getPendingDoctors);
router.put('/approve/:id', protect, adminOnly, approveDoctor);
router.put('/reject/:id', protect, adminOnly, rejectDoctor);

module.exports = router;
