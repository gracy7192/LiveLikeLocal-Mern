import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight, FiMapPin, FiStar, FiCalendar } from 'react-icons/fi';
import API from '../utils/api';
import ListingCard from '../components/common/ListingCard';

const Home = () => {
  const [hiddenGems, setHiddenGems] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchHiddenGems();
    fetchFeatured();
  }, []);

  const fetchHiddenGems = async () => {
    try {
      const { data } = await API.get('/listings/hidden-gems');
      setHiddenGems(data.data || []);
    } catch (error) {
      console.error('Error fetching hidden gems:', error);
    }
  };

  const fetchFeatured = async () => {
    try {
      const { data } = await API.get('/listings?limit=6');
      setFeatured(data.data || []);
    } catch (error) {
      console.error('Error fetching featured:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-tag">🌍 Discover India's Hidden Cultural Treasures</div>
            <h1>Live Like a <span>Local</span>, Not a Tourist</h1>
            <p>
              Immerse yourself in authentic Indian culture through homestays with local families,
              hands-on cultural experiences, and exclusive festival celebrations.
            </p>

            <form onSubmit={handleSearch} className="search-bar" style={{ margin: 0, maxWidth: '100%' }}>
              <input
                type="text"
                placeholder="Search by city, state, or experience..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <FiSearch size={18} /> Search
              </button>
            </form>

            <div className="hero-stats">
              <div className="hero-stat">
                <h3>500+</h3>
                <p>Cultural Experiences</p>
              </div>
              <div className="hero-stat">
                <h3>100+</h3>
                <p>Festival Events</p>
              </div>
              <div className="hero-stat">
                <h3>50+</h3>
                <p>Cities Covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Explore by Category</h2>
          <p className="section-subtitle">Choose your type of cultural immersion</p>

          <div className="categories-grid">
            <div className="category-card" onClick={() => navigate('/listings?category=homestay')}>
              <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600" alt="Homestays" />
              <div className="category-card-content">
                <h3>🏡 Homestays</h3>
                <p>Stay with local families</p>
              </div>
            </div>
            <div className="category-card" onClick={() => navigate('/listings?category=experience')}>
              <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600" alt="Experiences" />
              <div className="category-card-content">
                <h3>✨ Experiences</h3>
                <p>Hands-on cultural activities</p>
              </div>
            </div>
            <div className="category-card" onClick={() => navigate('/listings?category=festival')}>
              <img src="https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=600" alt="Festivals" />
              <div className="category-card-content">
                <h3>🎉 Festivals</h3>
                <p>Limited-slot festival events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <div>
                <h2 className="section-title">Featured Experiences</h2>
                <p className="section-subtitle" style={{ marginBottom: 0 }}>Handpicked cultural gems for you</p>
              </div>
              <Link to="/listings" className="btn btn-outline btn-sm">
                View All <FiArrowRight />
              </Link>
            </div>
            <div className="listings-grid">
              {featured.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hidden Gems */}
      {hiddenGems.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2 className="section-title">💎 Hidden Gems</h2>
            <p className="section-subtitle">Off-the-beaten-path experiences waiting to be discovered</p>
            <div className="listings-grid">
              {hiddenGems.slice(0, 4).map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 className="section-title">Ready to Explore India's Soul?</h2>
          <p className="section-subtitle">Join thousands of travelers discovering authentic cultural experiences</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">Start Your Journey</Link>
            <Link to="/listings" className="btn btn-outline btn-lg">Browse Listings</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

