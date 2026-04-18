import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiMessageSquare, FiUsers, FiHome, FiDollarSign, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/common/ListingCard';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // State for different data
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminListings, setAdminListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create listing form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '', description: '', price: '', category: 'homestay',
    tags: [], 'location.city': '', 'location.state': '', 'location.lat': '',
    'location.lng': '', festivalName: '', festivalStart: '', festivalEnd: '',
    maxSlots: '', bookingCutoff: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'traveler') {
        const [bookingsRes, recsRes] = await Promise.all([
          API.get('/bookings/my'),
          API.get('/recommendations'),
        ]);
        setBookings(bookingsRes.data.data || []);
        setRecommendations(recsRes.data.data || []);
      } else if (user?.role === 'host') {
        const [listingsRes, bookingsRes] = await Promise.all([
          API.get('/listings/host/my-listings'),
          API.get('/bookings/host'),
        ]);
        setListings(listingsRes.data.data || []);
        setBookings(bookingsRes.data.data || []);
      } else if (user?.role === 'admin') {
        const [statsRes, usersRes, listingsRes] = await Promise.all([
          API.get('/admin/stats'),
          API.get('/admin/users'),
          API.get('/admin/listings'),
        ]);
        setAdminStats(statsRes.data.data);
        setAdminUsers(usersRes.data.data || []);
        setAdminListings(listingsRes.data.data || []);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Payment handler
  const handlePayment = async (booking) => {
    try {
      // 1. Fetch Razorpay key
      const { data: keyData } = await API.get('/payments/key');
      const razorpayKey = keyData.data;

      // 2. Create Order
      const { data } = await API.post('/payments/create-order', { bookingId: booking._id });
      
      const options = {
        key: razorpayKey,
        amount: data.data.amount,
        currency: data.data.currency,
        name: 'LiveLikeLocals',
        description: `Booking for ${booking.listing?.title}`,
        order_id: data.data.orderId,
        handler: async (response) => {
          try {
            await API.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id,
            });
            toast.success('Payment successful!');
            loadDashboardData();
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#e85d26' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('Failed to create payment order');
    }
  };

  // Host: Create listing
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', createForm.title);
      formData.append('description', createForm.description);
      formData.append('price', createForm.price);
      formData.append('category', createForm.category);
      
      // Handle objects as JSON strings for easier backend parsing
      formData.append('location', JSON.stringify({
        city: createForm['location.city'],
        state: createForm['location.state'],
        lat: Number(createForm['location.lat']) || 0,
        lng: Number(createForm['location.lng']) || 0,
      }));

      formData.append('tags', JSON.stringify(createForm.tags));

      if (createForm.category === 'festival') {
        formData.append('festivalName', createForm.festivalName);
        formData.append('festivalDates', JSON.stringify({
          start: createForm.festivalStart,
          end: createForm.festivalEnd
        }));
        formData.append('maxSlots', createForm.maxSlots);
        formData.append('bookingCutoff', createForm.bookingCutoff);
      }

      // Append files
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      await API.post('/listings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Listing created! Pending admin approval.');
      setShowCreateForm(false);
      setSelectedFiles([]);
      setCreateForm({
        title: '', description: '', price: '', category: 'homestay',
        tags: [], 'location.city': '', 'location.state': '', 'location.lat': '',
        'location.lng': '', festivalName: '', festivalStart: '', festivalEnd: '',
        maxSlots: '', bookingCutoff: '',
      });
      loadDashboardData();
      setActiveTab('overview');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  // Host: Update booking status
  const handleBookingStatus = async (bookingId, status) => {
    try {
      await API.put(`/bookings/${bookingId}/status`, { status });
      toast.success(`Booking ${status}`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  // Traveler: Cancel booking
  const handleCancelBooking = async (bookingId) => {
    try {
      await API.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  // Admin: Approve/Reject listing
  const handleListingAction = async (listingId, action) => {
    try {
      await API.put(`/admin/listings/${listingId}/${action}`);
      toast.success(`Listing ${action}d`);
      loadDashboardData();
    } catch (error) {
      toast.error(`Failed to ${action} listing`);
    }
  };

  // Admin: Delete user
  const handleDeleteUser = async (userId) => {
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success('User removed');
      loadDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove user');
    }
  };

  // Admin: Delete listing
  const handleDeleteListing = async (listingId) => {
    try {
      await API.delete(`/admin/listings/${listingId}`);
      toast.success('Listing removed');
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to remove listing');
    }
  };

  const allTags = ['food', 'culture', 'adventure', 'music', 'art', 'nature', 'history', 'spirituality', 'festivals'];

  if (loading) return <div className="loader" style={{ paddingTop: 120 }}><div className="spinner"></div></div>;

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-warning', confirmed: 'badge-success', cancelled: 'badge-danger',
      approved: 'badge-success', rejected: 'badge-danger',
      paid: 'badge-success', unpaid: 'badge-warning',
    };
    return map[status] || 'badge-primary';
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name}! 👋</h1>
          <p>Role: <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{user?.role}</span></p>
        </div>

        {/* ===== TRAVELER DASHBOARD ===== */}
        {user?.role === 'traveler' && (
          <>
            <div className="dashboard-stats">
              <div className="stat-card"><h3>{bookings.length}</h3><p>Total Bookings</p></div>
              <div className="stat-card"><h3>{bookings.filter(b => b.status === 'confirmed').length}</h3><p>Confirmed</p></div>
              <div className="stat-card"><h3>{bookings.filter(b => b.status === 'pending').length}</h3><p>Pending</p></div>
            </div>

            <div className="dashboard-tabs">
              <button className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>My Bookings</button>
              <button className={`dashboard-tab ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>Recommended</button>
            </div>

            {activeTab === 'overview' && (
              bookings.length > 0 ? (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Listing</th>
                        <th>Dates</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>
                            <Link to={`/listings/${booking.listing?._id}`} style={{ color: 'var(--primary-light)' }}>
                              {booking.listing?.title || 'Listing'}
                            </Link>
                          </td>
                          <td>{new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}</td>
                          <td>₹{booking.totalPrice?.toLocaleString()}</td>
                          <td><span className={`badge ${getStatusBadge(booking.status)}`}>{booking.status}</span></td>
                          <td><span className={`badge ${getStatusBadge(booking.paymentStatus)}`}>{booking.paymentStatus}</span></td>
                          <td style={{ display: 'flex', gap: 8 }}>
                            {booking.status === 'pending' && booking.paymentStatus !== 'paid' && (
                              <button className="btn btn-primary btn-sm" onClick={() => handlePayment(booking)}>Pay</button>
                            )}
                            {booking.status !== 'cancelled' && (
                              <button className="btn btn-danger btn-sm" onClick={() => handleCancelBooking(booking._id)}>Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <h3>No bookings yet</h3>
                  <p>Start exploring amazing cultural experiences!</p>
                  <Link to="/listings" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Listings</Link>
                </div>
              )
            )}

            {activeTab === 'recommendations' && (
              recommendations.length > 0 ? (
                <div className="listings-grid">
                  {recommendations.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="empty-state"><h3>No recommendations yet</h3><p>Book some experiences and we'll suggest more!</p></div>
              )
            )}
          </>
        )}

        {/* ===== HOST DASHBOARD ===== */}
        {user?.role === 'host' && (
          <>
            <div className="dashboard-stats">
              <div className="stat-card"><h3>{listings.length}</h3><p>My Listings</p></div>
              <div className="stat-card"><h3>{bookings.length}</h3><p>Total Bookings</p></div>
              <div className="stat-card"><h3>{bookings.filter(b => b.status === 'pending').length}</h3><p>Pending Requests</p></div>
            </div>

            <div className="dashboard-tabs">
              <button className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>My Listings</button>
              <button className={`dashboard-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>Booking Requests</button>
              <button className={`dashboard-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>+ New Listing</button>
            </div>

            {activeTab === 'overview' && (
              listings.length > 0 ? (
                <div className="listings-grid">
                  {listings.map((listing) => (
                    <div key={listing._id} style={{ position: 'relative' }}>
                      <ListingCard listing={listing} />
                      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5 }}>
                        <span className={`badge ${getStatusBadge(listing.status)}`}>{listing.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><h3>No listings yet</h3><p>Create your first listing to start hosting!</p></div>
              )
            )}

            {activeTab === 'bookings' && (
              bookings.length > 0 ? (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Listing</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>{booking.user?.name}</td>
                          <td>{booking.listing?.title}</td>
                          <td>{new Date(booking.checkIn).toLocaleDateString()} – {new Date(booking.checkOut).toLocaleDateString()}</td>
                          <td><span className={`badge ${getStatusBadge(booking.status)}`}>{booking.status}</span></td>
                          <td style={{ display: 'flex', gap: 8 }}>
                            {booking.status === 'pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleBookingStatus(booking._id, 'confirmed')}><FiCheck /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleBookingStatus(booking._id, 'cancelled')}><FiX /></button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state"><h3>No booking requests</h3></div>
              )
            )}

            {activeTab === 'create' && (
              <div style={{ maxWidth: 600 }}>
                <form onSubmit={handleCreateListing}>
                  <div className="form-group">
                    <label>Title</label>
                    <input className="form-control" value={createForm.title} onChange={(e) => setCreateForm({...createForm, title: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" value={createForm.description} onChange={(e) => setCreateForm({...createForm, description: e.target.value})} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>Price (₹/night)</label>
                      <input className="form-control" type="number" value={createForm.price} onChange={(e) => setCreateForm({...createForm, price: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select className="form-control" value={createForm.category} onChange={(e) => setCreateForm({...createForm, category: e.target.value})}>
                        <option value="homestay">🏡 Homestay</option>
                        <option value="experience">✨ Experience</option>
                        <option value="festival">🎉 Festival</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>City</label>
                      <input className="form-control" value={createForm['location.city']} onChange={(e) => setCreateForm({...createForm, 'location.city': e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input className="form-control" value={createForm['location.state']} onChange={(e) => setCreateForm({...createForm, 'location.state': e.target.value})} required />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>Latitude</label>
                      <input className="form-control" type="number" step="any" value={createForm['location.lat']} onChange={(e) => setCreateForm({...createForm, 'location.lat': e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Longitude</label>
                      <input className="form-control" type="number" step="any" value={createForm['location.lng']} onChange={(e) => setCreateForm({...createForm, 'location.lng': e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Tags</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {allTags.map((tag) => (
                        <button key={tag} type="button"
                          className={`filter-chip ${createForm.tags.includes(tag) ? 'active' : ''}`}
                          onClick={() => setCreateForm(prev => ({
                            ...prev,
                            tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
                          }))}
                          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                        >{tag}</button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Images (Max 5)</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files).slice(0, 5))}
                      required 
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} style={{ position: 'relative', width: 60, height: 60, borderRadius: 4, overflow: 'hidden' }}>
                          <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {createForm.category === 'festival' && (
                    <div style={{ padding: 20, background: 'rgba(248,181,0,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(248,181,0,0.2)', marginBottom: 20 }}>
                      <h4 style={{ color: 'var(--accent-soft)', marginBottom: 16 }}>🎉 Festival Details</h4>
                      <div className="form-group">
                        <label>Festival Name</label>
                        <input className="form-control" value={createForm.festivalName} onChange={(e) => setCreateForm({...createForm, festivalName: e.target.value})} required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label>Start Date</label>
                          <input className="form-control" type="date" value={createForm.festivalStart} onChange={(e) => setCreateForm({...createForm, festivalStart: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input className="form-control" type="date" value={createForm.festivalEnd} onChange={(e) => setCreateForm({...createForm, festivalEnd: e.target.value})} required />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label>Max Slots</label>
                          <input className="form-control" type="number" value={createForm.maxSlots} onChange={(e) => setCreateForm({...createForm, maxSlots: e.target.value})} required />
                        </div>
                        <div className="form-group">
                          <label>Booking Cutoff Date</label>
                          <input className="form-control" type="date" value={createForm.bookingCutoff} onChange={(e) => setCreateForm({...createForm, bookingCutoff: e.target.value})} required />
                        </div>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-lg">Create Listing</button>
                </form>
              </div>
            )}
          </>
        )}

        {/* ===== ADMIN DASHBOARD ===== */}
        {user?.role === 'admin' && (
          <>
            <div className="dashboard-stats">
              <div className="stat-card"><h3>{adminStats?.totalUsers || 0}</h3><p>Total Users</p></div>
              <div className="stat-card"><h3>{adminStats?.totalListings || 0}</h3><p>Total Listings</p></div>
              <div className="stat-card"><h3>{adminStats?.pendingListings || 0}</h3><p>Pending Approval</p></div>
              <div className="stat-card"><h3>₹{(adminStats?.totalRevenue || 0).toLocaleString()}</h3><p>Total Revenue</p></div>
            </div>

            <div className="dashboard-tabs">
              <button className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Listings</button>
              <button className={`dashboard-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
            </div>

            {activeTab === 'overview' && (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Host</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminListings.map((listing) => (
                      <tr key={listing._id}>
                        <td><Link to={`/listings/${listing._id}`} style={{ color: 'var(--primary-light)' }}>{listing.title}</Link></td>
                        <td>{listing.host?.name}</td>
                        <td><span className={`badge ${listing.category === 'festival' ? 'badge-festival' : 'badge-primary'}`}>{listing.category}</span></td>
                        <td>₹{listing.price?.toLocaleString()}</td>
                        <td><span className={`badge ${getStatusBadge(listing.status)}`}>{listing.status}</span></td>
                        <td style={{ display: 'flex', gap: 8 }}>
                          {listing.status === 'pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleListingAction(listing._id, 'approve')}><FiCheck /> Approve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleListingAction(listing._id, 'reject')}><FiX /> Reject</button>
                            </>
                          )}
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteListing(listing._id)}><FiTrash2 /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          {u.role !== 'admin' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}><FiTrash2 /> Remove</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

