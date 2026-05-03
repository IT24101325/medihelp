const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Payment = require('../models/Payment');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: 'doctor', status: 'approved' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentsToday = await Appointment.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'Cancelled' }
    });

    const pendingAppointments = await Appointment.countDocuments({ status: 'Pending' });

    // Payment stats
    const paidPayments = await Payment.find({ status: 'Paid' });
    const totalRevenue = paidPayments.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const unpaidCashPaymentsCount = await Payment.countDocuments({ status: 'Unpaid', paymentMethod: 'Cash' });

    res.status(200).json({
      totalDoctors,
      totalPatients,
      appointmentsToday,
      pendingAppointments,
      totalRevenue,
      unpaidCashPaymentsCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete patient and all associated data
// @route   DELETE /api/admin/patients/:id
// @access  Private (Admin)
const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Delete associated appointments
    await Appointment.deleteMany({ patientId });
    
    // Delete associated medical records
    await MedicalRecord.deleteMany({ patientId });
    
    // Delete the user
    await User.findByIdAndDelete(patientId);

    res.status(200).json({ message: 'Patient and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAdminStats, deletePatient };
