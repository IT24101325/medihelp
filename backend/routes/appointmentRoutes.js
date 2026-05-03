const express = require('express');
const router = express.Router();
const {
  createAppointment, getAllAppointments, getMyAppointments,
  getDoctorAppointments, getAppointmentById,
  updateAppointmentStatus, addAppointmentNotes, cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, adminOnly, doctorOrAdmin } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.post('/', createAppointment);
router.get('/', adminOnly, getAllAppointments);
router.get('/my', getMyAppointments);
router.get('/doctor/:id', doctorOrAdmin, getDoctorAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id/status', doctorOrAdmin, updateAppointmentStatus);
router.put('/:id/notes', doctorOrAdmin, addAppointmentNotes);
router.delete('/:id', cancelAppointment);

module.exports = router;
