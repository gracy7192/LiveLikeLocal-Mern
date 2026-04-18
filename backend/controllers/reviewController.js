const Review = require('../models/Review');
const Listing = require('../models/Listing');

// @desc    Add review
// @route   POST /api/reviews/:listingId
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const listingId = req.params.listingId;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: req.user.id,
      listing: listingId,
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Already reviewed this listing' });
    }

    const review = await Review.create({
      user: req.user.id,
      listing: listingId,
      rating: Number(rating),
      comment,
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a listing
// @route   GET /api/reviews/:listingId
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listing: req.params.listingId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const listingId = review.listing;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate ratings
    await Review.calcAverageRating(listingId);

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
