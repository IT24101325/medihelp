const Payment = require('../models/Payment');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Create a payment (at booking)
// @route   POST /api/payments/create
// @access  Private (Patient)
const createPayment = async (req, res) => {
  try {
    const { appointmentId, doctorId, consultationFee, paymentMethod } = req.body;
    
    const status = paymentMethod === 'Card' ? 'Paid' : 'Unpaid';
    const paidAt = paymentMethod === 'Card' ? new Date() : null;

    const payment = await Payment.create({
      patientId: req.user._id,
      doctorId,
      appointmentId,
      consultationFee,
      totalAmount: consultationFee,
      paymentMethod,
      status,
      paidAt
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get patient payments
// @route   GET /api/payments/patient/:id
// @access  Private (Patient)
const getPatientPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.params.id })
      .populate('doctorId', 'name specialization profileImage')
      .populate('appointmentId', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctor payments
// @route   GET /api/payments/doctor/:id
// @access  Private (Doctor)
const getDoctorPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ doctorId: req.params.id })
      .populate('patientId', 'name email phone profileImage')
      .populate('appointmentId', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private (Admin)
const getAllPayments = async (req, res) => {
  try {
    const { status, appointmentId } = req.query;
    const query = status && status !== 'All' ? { status } : {};
    if (appointmentId) query.appointmentId = appointmentId;
    
    const payments = await Payment.find(query)
      .populate('patientId', 'name')
      .populate('doctorId', 'name')
      .populate('appointmentId', 'appointmentDate appointmentTime')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark cash payment as paid
// @route   PUT /api/payments/:id/mark-paid
// @access  Private (Doctor)
const markPaid = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const doctorProfile = await Doctor.findOne({ userId: req.user._id });
    if (!doctorProfile || payment.doctorId.toString() !== doctorProfile._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this payment as paid' });
    }

    if (payment.paymentMethod !== 'Cash') {
      return res.status(400).json({ message: 'Only cash payments can be marked as paid' });
    }

    payment.status = 'Paid';
    payment.paidAt = new Date();
    await payment.save();

    res.json({ message: 'Payment marked as paid successfully!', payment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get payment by appointment ID
// @route   GET /api/payments/appointment/:appointmentId
// @access  Private (Patient/Doctor/Admin)
const getPaymentByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const payment = await Payment.findOne({ appointmentId })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found for this appointment' });
    }

    // Check authorization: Admin, the patient, or the doctor
    if (req.user.role !== 'admin' && 
        payment.patientId._id.toString() !== req.user._id.toString()) {
      
      // If it's a doctor, we need to find their doctor profile to compare ID
      if (req.user.role === 'doctor') {
          const doctorProfile = await Doctor.findOne({ userId: req.user._id });
          if (!doctorProfile || payment.doctorId._id.toString() !== doctorProfile._id.toString()) {
              return res.status(403).json({ message: 'Not authorized to view this payment' });
          }
      } else {
          return res.status(403).json({ message: 'Not authorized to view this payment' });
      }
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment by appointment:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Keeping this for compatibility if needed, but the flow has changed
const createPaymentRecord = async (appointmentId) => {
  // Logic moved to createPayment
  return null;
};

module.exports = {
  createPayment,
  getPatientPayments,
  getDoctorPayments,
  getAllPayments,
  markPaid,
  getPaymentByAppointment,
  createPaymentRecord
};
