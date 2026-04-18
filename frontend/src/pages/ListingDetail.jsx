import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMapPin, FiStar, FiCalendar, FiUsers, FiMessageSquare, FiClock } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [remainingSlots, setRemainingSlots] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchListing();
    fetchReviews();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await API.get(`/listings/${id}`);
      setListing(data.data);
      setRemainingSlots(data.remainingSlots);

      // Pre-fill dates for festival
      if (data.data.category === 'festival' && data.data.festivalDates) {
        setCheckIn(new Date(data.data.festivalDates.start));
        setCheckOut(new Date(data.data.festivalDates.end));
      }
    } catch (error) {
      toast.error('Failed to load listing');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await API.get(`/reviews/${id}`);
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error('Please select dates');
      return;
    }

    setBookingLoading(true);
    try {
      const { data } = await API.post('/bookings', {
        listingId: id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests,
      });

      toast.success('Booking created! Proceed to payment.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to review');
      return;
    }

    try {
      await API.post(`/reviews/${id}`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted!');
      setReviewComment('');
      fetchReviews();
      fetchListing();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const calculateTotal = () => {
    if (!checkIn || !checkOut || !listing) return 0;
    const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return listing.price * Math.max(days, 1) * guests;
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  if (loading) return <div className="loader" style={{ paddingTop: 120 }}><div className="spinner"></div></div>;
  if (!listing) return null;

  const imageUrl = listing.images?.[0]?.url || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200';

  return (
    <div className="listing-detail">
      <div className="container">
        {/* Hero Image */}
        <div className="listing-detail-hero">
          <img src={imageUrl} alt={listing.title} />
          <div className="listing-detail-hero-overlay">
            <span className={`badge ${listing.category === 'festival' ? 'badge-festival' : listing.category === 'experience' ? 'badge-success' : 'badge-primary'}`}>
              {listing.category === 'festival' ? '🎉 Festival' : listing.category === 'experience' ? '✨ Experience' : '🏡 Homestay'}
            </span>
          </div>
        </div>

        <div className="listing-detail-content">
          {/* Main Info */}
          <div className="listing-detail-info">
            <h1>{listing.title}</h1>

            <div className="listing-detail-meta">
              <div className="listing-detail-meta-item">
                <FiMapPin size={16} />
                <span>{listing.location?.city}, {listing.location?.state}</span>
              </div>
              <div className="listing-detail-meta-item">
                <FiStar size={16} color="var(--accent-soft)" />
                <span>{listing.avgRating?.toFixed(1)} ({listing.numReviews} reviews)</span>
              </div>
              {listing.category === 'festival' && listing.festivalName && (
                <div className="listing-detail-meta-item">
                  <FiCalendar size={16} />
                  <span>{listing.festivalName}</span>
                </div>
              )}
            </div>

            <p className="listing-detail-description">{listing.description}</p>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {listing.tags?.map((tag) => (
                <span key={tag} className="badge badge-primary">{tag}</span>
              ))}
            </div>

            {/* Host Info */}
            <div className="listing-detail-host">
              <div className="listing-detail-host-avatar">
                {getInitials(listing.host?.name)}
              </div>
              <div>
                <h4 style={{ marginBottom: 4 }}>Hosted by {listing.host?.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{listing.host?.bio || 'Passionate local host'}</p>
              </div>
              {isAuthenticated && user?.role === 'traveler' && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => navigate(`/chat?to=${listing.host?._id}`)}
                >
                  <FiMessageSquare /> Chat
                </button>
              )}
            </div>

            {/* Map */}
            {listing.location?.lat && listing.location?.lng && (
              <div className="map-container">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${listing.location.lat},${listing.location.lng}&zoom=12`}
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* Reviews */}
            <div className="reviews-section">
              <h2 className="section-title" style={{ fontSize: '1.5rem' }}>Reviews ({reviews.length})</h2>

              {/* Review Form */}
              {isAuthenticated && user?.role === 'traveler' && (
                <form onSubmit={handleReview} style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        style={{
                          background: 'none',
                          fontSize: '1.5rem',
                          color: star <= reviewRating ? 'var(--accent-soft)' : 'var(--text-muted)',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="form-control"
                    placeholder="Write your review..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    style={{ marginBottom: 12 }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
                </form>
              )}

              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="review-user">
                        <div className="review-avatar">{getInitials(review.user?.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{review.user?.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="review-stars">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} style={{ color: i < review.rating ? 'var(--accent-soft)' : 'var(--text-muted)' }}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="review-text">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            <div className="booking-card">
              <div className="price">₹{listing.price?.toLocaleString()}<span>/night</span></div>

              {/* Festival Info */}
              {listing.category === 'festival' && (
                <div className="festival-info">
                  <h4>🎉 {listing.festivalName || 'Festival Event'}</h4>
                  {listing.festivalDates && (
                    <p>
                      <FiCalendar size={14} style={{ marginRight: 4 }} />
                      {new Date(listing.festivalDates.start).toLocaleDateString()} – {new Date(listing.festivalDates.end).toLocaleDateString()}
                    </p>
                  )}
                  {remainingSlots !== null && (
                    <>
                      <p><FiUsers size={14} style={{ marginRight: 4 }} /> {remainingSlots} of {listing.maxSlots} slots remaining</p>
                      <div className="slots-indicator">
                        <div className="slots-bar">
                          <div className="slots-bar-fill" style={{ width: `${((listing.maxSlots - remainingSlots) / listing.maxSlots) * 100}%` }}></div>
                        </div>
                      </div>
                    </>
                  )}
                  {listing.bookingCutoff && (
                    <p style={{ marginTop: 8 }}>
                      <FiClock size={14} style={{ marginRight: 4 }} />
                      Book by {new Date(listing.bookingCutoff).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="booking-dates">
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Check-in</label>
                  <DatePicker
                    selected={checkIn}
                    onChange={setCheckIn}
                    minDate={new Date()}
                    placeholderText="Select date"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Check-out</label>
                  <DatePicker
                    selected={checkOut}
                    onChange={setCheckOut}
                    minDate={checkIn || new Date()}
                    placeholderText="Select date"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Guests</label>
                <select className="form-control" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((g) => (
                    <option key={g} value={g}>{g} Guest{g > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {checkIn && checkOut && (
                <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>₹{listing.price?.toLocaleString()} × {Math.max(Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)), 1)} night(s) × {guests} guest(s)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.2rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--primary-light)' }}>₹{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={handleBooking}
                disabled={bookingLoading || (listing.category === 'festival' && remainingSlots === 0)}
              >
                {bookingLoading ? 'Booking...' :
                 listing.category === 'festival' && remainingSlots === 0 ? 'Sold Out' :
                 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;

