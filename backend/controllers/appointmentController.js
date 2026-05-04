const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Doctor = require('../models/Doctor');

// @desc    Book new appointment
// @route   POST /api/appointments/book
// @access  Private (Patient)
const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: 'Doctor, appointment date, and time are required',
      });
    }

    // Get doctor info for fee
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Prevent double-booking: check if doctor already has appointment at same date+time
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $nin: ['Cancelled'] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        message: 'Doctor already has an appointment at this date and time',
      });
    }

    const appointment = await Appointment.create({
      patientId: req.user._id, // Auto-populate from JWT
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason: reason || '',
      status: 'Pending'
    });

    // Create UNPAID payment record immediately
    await Payment.create({
      patientId: req.user._id,
      doctorId,
      appointmentId: appointment._id,
      consultationFee: doctor.consultationFee,
      totalAmount: doctor.consultationFee,
      paymentMethod: null,
      status: 'Unpaid'
    });

    // Populate and return
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee availableDays availableTime');

    res.status(201).json(populatedAppointment);
  } catch (error) {
    console.error('Create appointment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all appointments (admin)
// @route   GET /api/appointments
// @access  Private (Admin)
const getAllAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== 'All' ? { status } : {};

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization availableDays availableTime')
      .sort({ appointmentDate: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Get all appointments error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged-in patient's appointments
// @route   GET /api/appointments/my
// @access  Private
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate('doctorId', 'name specialization consultationFee profileImage availableDays availableTime')
      .sort({ appointmentDate: -1 });

    // Fetch payment status for each appointment
    const appointmentsWithPayment = await Promise.all(
      appointments.map(async (app) => {
        const payment = await Payment.findOne({ appointmentId: app._id });
        return {
          ...app.toObject(),
          paymentStatus: payment ? payment.status : 'Unpaid',
          paymentId: payment ? payment._id : null,
          paymentMethod: payment ? payment.paymentMethod : null,
        };
      })
    );

    res.status(200).json(appointmentsWithPayment);
  } catch (error) {
    console.error('Get my appointments error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all appointments for a doctor
// @route   GET /api/appointments/doctor/:id
// @access  Private
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.id })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization availableDays availableTime')
      .sort({ appointmentDate: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Get doctor appointments error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization consultationFee hospital availableDays availableTime');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin/Doctor)
const { createPaymentRecord } = require('./paymentController');

// ... existing code ...

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

    // Trigger payment creation if status is Completed
    if (status === 'Completed') {
      await createPaymentRecord(appointment._id);
    }

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization availableDays availableTime');

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Update appointment status error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add doctor notes
// @route   PUT /api/appointments/:id/notes
// @access  Private (Doctor)
const addAppointmentNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.notes = notes || '';
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    console.error('Add appointment notes error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update appointment (date, time, reason)
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the patient who booked or an admin can update
    if (appointment.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    if (appointment.status === 'Cancelled' || appointment.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot update cancelled or completed appointments' });
    }

    if (appointmentDate) appointment.appointmentDate = new Date(appointmentDate);
    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (reason) appointment.reason = reason;

    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization availableDays availableTime');

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update appointment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel appointment (patient/admin)
// @route   DELETE /api/appointments/:id
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the patient who booked or an admin can cancel
    if (appointment.patientId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'Cancelled' || appointment.status === 'Completed') {
      return res.status(400).json({
        message: 'Appointment is already cancelled or completed',
      });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    res.status(200).json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createAppointment, getAllAppointments, getMyAppointments,
  getDoctorAppointments, getAppointmentById,
  updateAppointmentStatus, addAppointmentNotes, cancelAppointment,
  updateAppointment,
};
