const express = require('express');
const router = express.Router();
const {
  getPatientPayments,
  getDoctorPayments,
  getAllPayments,
  markPaid,
  getPaymentByAppointment,
  getMyPayments,
  payPayment,
} = require('../controllers/paymentController');
const { protect, adminOnly, doctorOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.put('/:id/pay', payPayment);
router.get('/patient/:id', getPatientPayments);
router.get('/doctor/:id', doctorOnly, getDoctorPayments);
router.get('/appointment/:appointmentId', getPaymentByAppointment);
router.get('/my', getMyPayments);
router.get('/', adminOnly, getAllPayments);
router.put('/:id/mark-paid', doctorOnly, markPaid);

module.exports = router;
