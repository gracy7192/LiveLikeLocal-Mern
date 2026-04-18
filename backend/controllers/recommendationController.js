const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// @desc    Get recommended listings for user
// @route   GET /api/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    let recommendedListings = [];

    // Strategy 1: Based on user's past bookings
    const userBookings = await Booking.find({ user: req.user.id })
      .populate('listing', 'tags category')
      .limit(20);

    if (userBookings.length > 0) {
      // Extract tags from past bookings
      const userTags = new Set();
      const bookedListingIds = [];

      userBookings.forEach((booking) => {
        if (booking.listing) {
          bookedListingIds.push(booking.listing._id);
          if (booking.listing.tags) {
            booking.listing.tags.forEach((tag) => userTags.add(tag));
          }
        }
      });

      // Find similar listings the user hasn't booked
      if (userTags.size > 0) {
        recommendedListings = await Listing.find({
          status: 'approved',
          _id: { $nin: bookedListingIds },
          tags: { $in: Array.from(userTags) },
        })
          .populate('host', 'name avatar')
          .sort({ avgRating: -1, bookedCount: -1 })
          .limit(8);
      }
    }

    // Strategy 2: Based on user's interests (profile)
    if (recommendedListings.length < 8 && req.user.interests && req.user.interests.length > 0) {
      const existingIds = recommendedListings.map((l) => l._id);
      const interestBased = await Listing.find({
        status: 'approved',
        _id: { $nin: existingIds },
        tags: { $in: req.user.interests },
      })
        .populate('host', 'name avatar')
        .sort({ avgRating: -1 })
        .limit(8 - recommendedListings.length);

      recommendedListings = [...recommendedListings, ...interestBased];
    }

    // Strategy 3: Fallback - Trending / Popular
    if (recommendedListings.length < 8) {
      const existingIds = recommendedListings.map((l) => l._id);
      const trending = await Listing.find({
        status: 'approved',
        _id: { $nin: existingIds },
      })
        .populate('host', 'name avatar')
        .sort({ bookedCount: -1, avgRating: -1, viewCount: -1 })
        .limit(8 - recommendedListings.length);

      recommendedListings = [...recommendedListings, ...trending];
    }

    res.status(200).json({ success: true, data: recommendedListings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
