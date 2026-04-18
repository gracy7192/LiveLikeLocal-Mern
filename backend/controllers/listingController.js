const Listing = require('../models/Listing');
const Booking = require('../models/Booking');

// @desc    Create listing
// @route   POST /api/listings
exports.createListing = async (req, res) => {
  try {
    req.body.host = req.user.id;

    // Reconstruct nested objects if sent as strings (important for multipart/form-data)
    if (typeof req.body.location === 'string') {
      try { req.body.location = JSON.parse(req.body.location); } catch (e) {}
    }
    if (typeof req.body.festivalDates === 'string') {
      try { req.body.festivalDates = JSON.parse(req.body.festivalDates); } catch (e) {}
    }
    if (typeof req.body.tags === 'string') {
      try { req.body.tags = JSON.parse(req.body.tags); } catch (e) {}
    }

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      req.body.images = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    const listing = await Listing.create(req.body);
    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all approved listings with filters
// @route   GET /api/listings
exports.getListings = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, rating, tags, page = 1, limit = 12 } = req.query;

    const query = { status: 'approved' };

    // Search by city or state
    if (search) {
      query.$or = [
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by rating
    if (rating) {
      query.avgRating = { $gte: Number(rating) };
    }

    // Filter by tags
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('host', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: listings,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('host', 'name avatar bio phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Increment view count
    listing.viewCount += 1;
    await listing.save();

    // If festival, calculate remaining slots
    let remainingSlots = null;
    if (listing.category === 'festival' && listing.maxSlots > 0) {
      const confirmedBookings = await Booking.countDocuments({
        listing: listing._id,
        status: { $in: ['pending', 'confirmed'] },
      });
      remainingSlots = listing.maxSlots - confirmedBookings;
    }

    res.status(200).json({
      success: true,
      data: listing,
      remainingSlots,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
exports.updateListing = async (req, res) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Verify ownership
    if (listing.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update' });
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
      req.body.images = [...(listing.images || []), ...newImages];
    }

    listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete' });
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hidden gems (least viewed listings)
// @route   GET /api/listings/hidden-gems
exports.getHiddenGems = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'approved' })
      .populate('host', 'name avatar')
      .sort({ viewCount: 1, avgRating: -1 })
      .limit(8);

    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get host's listings
// @route   GET /api/listings/my-listings
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ host: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
