import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiStar } from 'react-icons/fi';

const ListingCard = ({ listing }) => {
  const navigate = useNavigate();

  const getCategoryBadge = (category) => {
    const badges = {
      homestay: { class: 'badge badge-primary', label: 'Homestay' },
      experience: { class: 'badge badge-success', label: 'Experience' },
      festival: { class: 'badge badge-festival', label: '🎉 Festival' },
    };
    return badges[category] || badges.homestay;
  };

  const badge = getCategoryBadge(listing.category);
  const imageUrl = listing.images?.[0]?.url || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400';

  return (
    <div className="listing-card" onClick={() => navigate(`/listings/${listing._id}`)}>
      <div className="listing-card-image">
        <img src={imageUrl} alt={listing.title} loading="lazy" />
        <div className="listing-card-badge">
          <span className={badge.class}>{badge.label}</span>
        </div>
        <div className="listing-card-price">₹{listing.price?.toLocaleString()}<span>/night</span></div>
      </div>
      <div className="listing-card-body">
        <h3>{listing.title}</h3>
        <div className="listing-card-location">
          <FiMapPin size={14} />
          <span>{listing.location?.city}, {listing.location?.state}</span>
        </div>
        <div className="listing-card-footer">
          <div className="listing-card-rating">
            <FiStar size={14} fill="currentColor" />
            <span>{listing.avgRating?.toFixed(1) || '0.0'}</span>
            <span style={{ color: 'var(--text-muted)' }}>({listing.numReviews || 0})</span>
          </div>
          <div className="listing-card-tags">
            {listing.tags?.slice(0, 2).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
