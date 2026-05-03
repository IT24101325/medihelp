const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPatientPayments,
  getDoctorPayments,
  getAllPayments,
  markPaid,
  getPaymentByAppointment,
} = require('../controllers/paymentController');
const { protect, adminOnly, doctorOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/create', createPayment);
router.get('/patient/:id', getPatientPayments);
router.get('/doctor/:id', doctorOnly, getDoctorPayments);
router.get('/appointment/:appointmentId', getPaymentByAppointment);
router.get('/', adminOnly, getAllPayments);
router.put('/:id/mark-paid', doctorOnly, markPaid);

module.exports = router;
