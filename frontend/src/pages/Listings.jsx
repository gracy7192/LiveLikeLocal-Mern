import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiSliders } from 'react-icons/fi';
import API from '../utils/api';
import ListingCard from '../components/common/ListingCard';

const Listings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const s = searchParams.get('search');
      const c = searchParams.get('category');
      const p = searchParams.get('page');
      const min = searchParams.get('minPrice');
      const max = searchParams.get('maxPrice');
      const r = searchParams.get('rating');

      if (s) params.set('search', s);
      if (c) params.set('category', c);
      if (p) params.set('page', p);
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
      if (r) params.set('rating', r);

      const { data } = await API.get(`/listings?${params.toString()}`);
      setListings(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (rating) params.set('rating', rating);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSearchParams({});
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
  };

  const categories = [
    { value: '', label: 'All' },
    { value: 'homestay', label: '🏡 Homestays' },
    { value: 'experience', label: '✨ Experiences' },
    { value: 'festival', label: '🎉 Festivals' },
  ];

  return (
    <div style={{ paddingTop: 100, minHeight: '100vh' }}>
      <div className="container">
        <div style={{ marginBottom: 40 }}>
          <h1 className="section-title">Explore Listings</h1>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            {pagination.total} {category || 'cultural'} experiences waiting for you
          </p>

          {/* Search */}
          <form onSubmit={applyFilters}>
            <div className="search-bar" style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search by city, state, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <FiSearch size={18} /> Search
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiSliders size={18} />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 20,
                padding: 20,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Min Price (₹)</label>
                  <input className="form-control" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Max Price (₹)</label>
                  <input className="form-control" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="10000" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Min Rating</label>
                  <select className="form-control" value={rating} onChange={(e) => setRating(e.target.value)}>
                    <option value="">Any</option>
                    <option value="3">3+ Stars</option>
                    <option value="4">4+ Stars</option>
                    <option value="4.5">4.5+ Stars</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <button type="submit" className="btn btn-primary btn-sm">Apply</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear</button>
                </div>
              </div>
            )}
          </form>

          {/* Category chips */}
          <div className="filter-bar">
            {categories.map((cat) => (
              <button
                key={cat.value}
                className={`filter-chip ${category === cat.value ? 'active' : ''}`}
                onClick={() => {
                  setCategory(cat.value);
                  const params = new URLSearchParams(searchParams);
                  if (cat.value) params.set('category', cat.value);
                  else params.delete('category');
                  setSearchParams(params);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="loader"><div className="spinner"></div></div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings found</h3>
            <p>Try adjusting your search or filters</p>
            <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="listings-grid">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>Prev</button>
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={pagination.page === i + 1 ? 'active' : ''}
                    onClick={() => goToPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button disabled={pagination.page >= pagination.pages} onClick={() => goToPage(pagination.page + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Listings;

