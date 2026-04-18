const express = require('express');
const router = express.Router();
const { addReview, getReviews, deleteReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.post('/:listingId', protect, authorize('traveler'), addReview);
router.get('/:listingId', getReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;
