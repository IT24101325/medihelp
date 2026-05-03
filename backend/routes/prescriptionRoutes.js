const express = require('express');
const router = express.Router();
const {
  createPrescription, getMyPrescriptions, getDoctorPrescriptions,
  getPrescriptionById, updatePrescription, deletePrescription,
  uploadPrescriptionImage,
} = require('../controllers/prescriptionController');
const { protect, doctorOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

router.post('/', doctorOrAdmin, createPrescription);
router.get('/my', getMyPrescriptions);
router.get('/doctor/:id', getDoctorPrescriptions);
router.get('/:id', getPrescriptionById);
router.put('/:id', doctorOrAdmin, updatePrescription);
router.delete('/:id', doctorOrAdmin, deletePrescription);
router.post('/:id/upload', upload.single('prescription'), uploadPrescriptionImage);

module.exports = router;
