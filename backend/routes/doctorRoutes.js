const express = require('express');
const router = express.Router();
const {
  createDoctor, getDoctors, getDoctorById,
  updateDoctor, deleteDoctor, uploadDoctorImage,
  getMyDoctorProfile, updateMyDoctorProfile,
} = require('../controllers/doctorController');
const { protect, adminOnly, doctorOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

// /me routes MUST come before /:id to avoid "me" being parsed as a MongoDB ObjectId
router.get('/me', doctorOrAdmin, getMyDoctorProfile);
router.put('/me', doctorOrAdmin, updateMyDoctorProfile);

router.post('/', adminOnly, createDoctor);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', adminOnly, updateDoctor);
router.delete('/:id', adminOnly, deleteDoctor);
router.post('/:id/upload-image', adminOnly, upload.single('image'), uploadDoctorImage);

module.exports = router;
