import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";
import { ADMIN_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, member, logout } = useAuth();

  const handleNewsClick = (e) => {
    e.preventDefault();
    setShowMenu(false);
    navigate("/news", {
      state: { refreshNews: true, refreshKey: Date.now() },
    });
  };

  const handleMarketplaceClick = (e) => {
    e.preventDefault();
    setShowMenu(false);
    navigate("/marketplace", {
      state: { refreshMarketplace: true, refreshKey: Date.now() },
    });
  };

  const handleBusinessClick = (e) => {
    e.preventDefault();
    setShowMenu(false);
    navigate("/business", {
      state: { refreshBusiness: true, refreshKey: Date.now() },
    });
  };

  const handleMatrimonialClick = (e) => {
    e.preventDefault();
    setShowMenu(false);
    navigate("/matrimonial", {
      state: { refreshMatrimonial: true, refreshKey: Date.now() },
    });
  };

  const handleGalleryClick = (e) => {
    e.preventDefault();
    setShowMenu(false);
    navigate("/gallery", {
      state: { refreshGallery: true, refreshKey: Date.now() },
    });
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    setShowMenu(false);
    navigate("/about", {
      state: { refreshAbout: true, refreshKey: Date.now() },
    });
  };

  const handleContactClick = (e) => {
    e.preventDefault();
    setShowMenu(false);
    navigate("/contact", {
      state: { refreshContact: true, refreshKey: Date.now() },
    });
  };

  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">NeighborNet</Link>

      {/* 3-dot menu icon (mobile) */}
      <div
        className="menu-icon"
        onClick={() => setShowMenu(!showMenu)}
      >
        &#8942;
      </div>

      <ul className={`nav-links ${showMenu ? "show" : ""}`}>
        <li><Link to="/news" onClick={handleNewsClick}>News</Link></li>
        <li><Link to="/marketplace" onClick={handleMarketplaceClick}>Marketplace</Link></li>
        <li><Link to="/business" onClick={handleBusinessClick}>Business</Link></li>
        <li><Link to="/matrimonial" onClick={handleMatrimonialClick}>Matrimonial</Link></li>
        <li><Link to="/gallery" onClick={handleGalleryClick}>Gallery</Link></li>
        <li><Link to="/about" onClick={handleAboutClick}>About Us</Link></li>
        <li><Link to="/contact" onClick={handleContactClick}>Contact</Link></li>
        
        {/* Show Become Member only when NOT logged in */}
        {!isAuthenticated && (
          <li>
            <Link
              to="/becomemember"
              onClick={() => setShowMenu(false)}
              className="backend-link become-member"
            >
              Become Member
            </Link>
          </li>
        )}
        
        {!isAuthenticated && (
          <>
            <li>
              <Link
                to="/member-login"
                onClick={() => setShowMenu(false)}
                className="backend-link member-login"
              >
                Member Login
              </Link>
            </li>
            <li>
              <a
                href={ADMIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="backend-link admin"
              >
                Admin Login
              </a>
            </li>
          </>
        )}
        
        {isAuthenticated && (
          <>
            <li>
              <Link
                to="/profile"
                onClick={() => setShowMenu(false)}
                className="backend-link profile-link"
              >
                Profile
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="backend-link logout-btn"
              >
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
