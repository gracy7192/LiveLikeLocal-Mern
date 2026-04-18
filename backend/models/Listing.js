const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: 0,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      enum: ['homestay', 'experience', 'festival'],
    },
    tags: [
      {
        type: String,
        enum: ['food', 'culture', 'adventure', 'music', 'art', 'nature', 'history', 'spirituality', 'festivals', 'beach', 'mountains', 'wildlife', 'religion'],
      },
    ],
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      address: { type: String, default: '' },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
      },
    ],
    // Festival-specific fields
    festivalName: {
      type: String,
      default: '',
    },
    festivalDates: {
      start: { type: Date },
      end: { type: Date },
    },
    maxSlots: {
      type: Number,
      default: 0,
    },
    bookingCutoff: {
      type: Date,
    },
    // General fields
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for search
listingSchema.index({ 'location.city': 1, 'location.state': 1, category: 1 });
listingSchema.index({ tags: 1 });
listingSchema.index({ status: 1, viewCount: 1 });

module.exports = mongoose.model('Listing', listingSchema);
