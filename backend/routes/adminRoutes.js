const express = require('express');
const router = express.Router();
const {
  getUsers,
  deleteUser,
  getAllListings,
  approveListing,
  rejectListing,
  deleteListing,
  getStats,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.get('/listings', getAllListings);
router.put('/listings/:id/approve', approveListing);
router.put('/listings/:id/reject', rejectListing);
router.delete('/listings/:id', deleteListing);

module.exports = router;
