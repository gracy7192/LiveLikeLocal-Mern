import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">🏡 <span>LiveLikeLocals</span></div>
            <p className="footer-desc">
              Discover authentic cultural experiences, homestays, and festival events across India.
              Travel beyond the tourist trail.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/listings">All Listings</Link>
            <Link to="/listings?category=homestay">Homestays</Link>
            <Link to="/listings?category=experience">Experiences</Link>
            <Link to="/listings?category=festival">Festivals</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/">About Us</Link>
            <Link to="/">Contact</Link>
            <Link to="/">Careers</Link>
            <Link to="/">Blog</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/">Help Center</Link>
            <Link to="/">Safety</Link>
            <Link to="/">Privacy Policy</Link>
            <Link to="/">Terms of Service</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} LiveLikeLocals. All rights reserved. Made with ❤️ in India.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
