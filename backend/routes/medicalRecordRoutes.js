const express = require('express');
const router = express.Router();
const {
  createMedicalRecord, getPatientRecords, getMyRecords,
  getRecordById, updateRecord, deleteRecord, uploadAttachment,
} = require('../controllers/medicalRecordController');
const { protect, adminOnly, doctorOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

router.post('/', doctorOrAdmin, createMedicalRecord);
router.get('/patient/:id', getPatientRecords);
router.get('/my', getMyRecords);
router.get('/:id', getRecordById);
router.put('/:id', doctorOrAdmin, updateRecord);
router.delete('/:id', adminOnly, deleteRecord);
router.post('/:id/attach', doctorOrAdmin, upload.single('attachment'), uploadAttachment);

module.exports = router;
