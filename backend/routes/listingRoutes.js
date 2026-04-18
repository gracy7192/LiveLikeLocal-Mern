const express = require('express');
const router = express.Router();
const {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  getHiddenGems,
  getMyListings,
} = require('../controllers/listingController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/hidden-gems', getHiddenGems);
router.get('/', getListings);
router.get('/:id', getListing);

// Host routes
router.post('/', protect, authorize('host'), upload.array('images', 5), createListing);
router.put('/:id', protect, authorize('host', 'admin'), upload.array('images', 5), updateListing);
router.delete('/:id', protect, authorize('host', 'admin'), deleteListing);
router.get('/host/my-listings', protect, authorize('host'), getMyListings);

module.exports = router;
