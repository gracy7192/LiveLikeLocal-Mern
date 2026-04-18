const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// @desc    Create booking
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Listing is not available' });
    }

    // Cannot book own listing
    if (listing.host.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot book your own listing' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ success: false, message: 'Check-out must be after check-in' });
    }

    if (checkInDate < new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book past dates' });
    }

    // ===== FESTIVAL BOOKING LOGIC =====
    if (listing.category === 'festival') {
      // Check booking cutoff
      if (listing.bookingCutoff && new Date() > new Date(listing.bookingCutoff)) {
        return res.status(400).json({
          success: false,
          message: 'Booking cutoff date has passed for this festival',
        });
      }

      // Validate dates within festival range
      if (listing.festivalDates && listing.festivalDates.start && listing.festivalDates.end) {
        const festStart = new Date(listing.festivalDates.start);
        const festEnd = new Date(listing.festivalDates.end);

        if (checkInDate < festStart || checkOutDate > new Date(festEnd.getTime() + 86400000)) {
          return res.status(400).json({
            success: false,
            message: `Booking must be within festival dates: ${festStart.toDateString()} - ${festEnd.toDateString()}`,
          });
        }
      }

      // Check available slots
      if (listing.maxSlots > 0) {
        const confirmedBookings = await Booking.countDocuments({
          listing: listing._id,
          status: { $in: ['pending', 'confirmed'] },
        });

        if (confirmedBookings >= listing.maxSlots) {
          return res.status(400).json({
            success: false,
            message: 'No slots available for this festival',
            remainingSlots: 0,
          });
        }
      }
    }

    // ===== DOUBLE BOOKING PREVENTION =====
    const existingBooking = await Booking.findOne({
      user: req.user.id,
      listing: listingId,
      status: { $in: ['pending', 'confirmed'] },
      $or: [
        { checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } },
      ],
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have a booking for these dates',
      });
    }

    // Calculate total price
    const days = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = listing.price * days * (guests || 1);

    const booking = await Booking.create({
      user: req.user.id,
      listing: listingId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guests || 1,
      totalPrice,
      status: 'pending',
    });

    // Increment booked count
    listing.bookedCount += 1;
    await listing.save();

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    // Handle duplicate key error (from compound index)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate booking detected' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's bookings
// @route   GET /api/bookings/my
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('listing', 'title images location category price')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for host's listings
// @route   GET /api/bookings/host
exports.getHostBookings = async (req, res) => {
  try {
    // Get all listings by this host
    const hostListings = await Listing.find({ host: req.user.id }).select('_id');
    const listingIds = hostListings.map((l) => l._id);

    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate('user', 'name email phone')
      .populate('listing', 'title category')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update booking status (Host)
// @route   PUT /api/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate('listing');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify the host owns this listing
    if (booking.listing.host.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking (Traveler)
// @route   PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
