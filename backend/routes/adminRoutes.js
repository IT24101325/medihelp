const express = require('express');
const router = express.Router();
const { getAdminStats, deletePatient } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.delete('/patients/:id', deletePatient);

module.exports = router;
