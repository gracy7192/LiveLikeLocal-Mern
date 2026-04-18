const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getRazorpayKey } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/key', protect, getRazorpayKey);
router.post('/create-order', protect, authorize('traveler'), createOrder);
router.post('/verify', protect, authorize('traveler'), verifyPayment);

module.exports = router;
