import React, { useEffect } from "react";
import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    event.currentTarget.style.setProperty("--mx", `${x}px`);
    event.currentTarget.style.setProperty("--my", `${y}px`);
  };

  const handleTouchMove = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = touch.clientX - bounds.left;
    const y = touch.clientY - bounds.top;

    event.currentTarget.style.setProperty("--mx", `${x}px`);
    event.currentTarget.style.setProperty("--my", `${y}px`);
  };

  return (
    <div
      className="home-page"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      
      <div className="hero-section">
        <h1 className="hero-title">
          Welcome to <span className="highlight-text">NeighborNet</span>
        </h1>
        <p className="hero-subtitle">
          Your modern local community portal connecting neighbors, businesses, and opportunities.
        </p>

        <div className="hero-cta-buttons">
          <Link to="/marketplace" className="home-btn primary">
            Explore Marketplace
          </Link>
          <Link to="/news" className="home-btn secondary">
            Latest News
          </Link>
        </div>
      </div>

      <div className="features-grid">
        <div className="home-feature-card" style={{ animationDelay: "0.1s" }}>
          <div className="feature-icon">📰</div>
          <h3>Stay Updated</h3>
          <p>Get the latest news and updates from your local community instantly.</p>
        </div>

        <div className="home-feature-card" style={{ animationDelay: "0.2s" }}>
          <div className="feature-icon">🛒</div>
          <h3 className="feature-title">Buy & Sell</h3>
          <p className="feature-desc">Discover amazing deals or sell items securely within your neighborhood.</p>
        </div>

        <div className="home-feature-card" style={{ animationDelay: "0.3s" }}>
          <div className="feature-icon">🏪</div>
          <h3>Local Businesses</h3>
          <p>Support your community by finding and connecting with local shops and services.</p>
        </div>

        <div className="home-feature-card" style={{ animationDelay: "0.4s" }}>
          <div className="feature-icon">🤝</div>
          <h3>Connect</h3>
          <p>Join events, meet new neighbors, and strengthen community bonds.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
