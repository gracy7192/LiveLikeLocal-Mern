const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please add a rating'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, 'Please add a comment'],
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// One review per user per listing
reviewSchema.index({ user: 1, listing: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRating = async function (listingId) {
  const result = await this.aggregate([
    { $match: { listing: listingId } },
    {
      $group: {
        _id: '$listing',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await mongoose.model('Listing').findByIdAndUpdate(listingId, {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      numReviews: result[0].numReviews,
    });
  } else {
    await mongoose.model('Listing').findByIdAndUpdate(listingId, {
      avgRating: 0,
      numReviews: 0,
    });
  }
};

// Recalculate after save
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.listing);
});

module.exports = mongoose.model('Review', reviewSchema);
