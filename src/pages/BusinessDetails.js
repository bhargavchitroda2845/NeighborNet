import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./BusinessDetails.css";
import { BUSINESS_DETAIL_API_URL } from "../config/api";

function getCreatedByRef(business) {
  if (!business) return null;

  const createdByName =
    typeof business.created_by_name === "string" && business.created_by_name.trim()
      ? business.created_by_name.trim()
      : null;

  if (!createdByName) {
    return null;
  }

  return {
    name: createdByName,
    username: createdByName,
  };
}

function getBusinessSlug(businessRef) {
  if (!businessRef) return "";

  if (typeof businessRef === "string") {
    const raw = businessRef.trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw);
      const slugFromQuery =
        parsed.searchParams.get("business_slug") || parsed.searchParams.get("slug");
      return slugFromQuery ? slugFromQuery.trim() : "";
    } catch {
      return raw;
    }
  }

  if (typeof businessRef === "object") {
    if (typeof businessRef.slug === "string" && businessRef.slug.trim()) {
      return businessRef.slug.trim();
    }
    if (typeof businessRef.business_slug === "string" && businessRef.business_slug.trim()) {
      return businessRef.business_slug.trim();
    }
  }

  return "";
}

function BusinessDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousBusiness, setPreviousBusiness] = useState(null);
  const [nextBusiness, setNextBusiness] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const apiUrl = slug 
      ? `${BUSINESS_DETAIL_API_URL}?slug=${encodeURIComponent(slug)}`
      : `${BUSINESS_DETAIL_API_URL}`;

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Business not found");
        }
        return res.json();
      })
      .then((data) => {
        const businessData = data.result || data;
        setBusiness(businessData);

        setPreviousBusiness(
          data.previous_item ||
          data.result?.previous_item ||
          data.previous ||
          data.prev ||
          data.previous_business ||
          data.result?.previous ||
          data.result?.previous_business ||
          null
        );
        setNextBusiness(
          data.next_item ||
          data.result?.next_item ||
          data.next ||
          data.next_business ||
          data.result?.next ||
          data.result?.next_business ||
          null
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error("Business detail error:", err);
        setBusiness(null);
        setPreviousBusiness(null);
        setNextBusiness(null);
        setError("Failed to load business details");
        setLoading(false);
      });
  }, [slug]);

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

  const previousSlug = getBusinessSlug(previousBusiness);
  const nextSlug = getBusinessSlug(nextBusiness);
  const createdByRef = getCreatedByRef(business);

  if (loading) {
    return <div className="business-details-loading">Loading business details...</div>;
  }

  if (error || !business) {
    return (
      <div className="business-details-error">
        <h2>Business not found</h2>
        <button onClick={() => navigate("/business")}>Back to Businesses</button>
      </div>
    );
  }

  return (
    <div 
      className="business-details-container"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <button
        type="button"
        className="business-back-btn"
        onClick={() => navigate("/business")}
      >
        ← Back to Businesses
      </button>

      {/* Business Header Section */}
      <div className="business-details-header">
        {business.image_url && (
          <div className="business-details-image">
            <img src={business.image_url} alt={business.name} />
          </div>
        )}
        
        <div className="business-details-info">
          {business.category && (
            <div className="business-category-badge">
              {business.category_icon && <span className="category-icon">{business.category_icon}</span>}
              <span className="category-name">{business.category}</span>
            </div>
          )}
          
          <h1>{business.name}</h1>
          
          {business.service && (
            <p className="business-service">
              <strong>Service:</strong> {business.service}
            </p>
          )}
          
          {business.area && (
            <p className="business-area">
              <strong>Area:</strong> {business.area}
            </p>
          )}
          
          {business.location && (
            <p className="business-location">
              <strong>Location:</strong> {business.location}
            </p>
          )}
        </div>
      </div>

      {/* Contact Details Section */}
      <div className="business-details-section">
        <h2>Contact Details</h2>
        <div className="contact-grid">
          {business.phone && (
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span className="contact-label">Phone:</span>
              <a href={`tel:${business.phone}`} className="contact-value">{business.phone}</a>
            </div>
          )}
          
          {business.address && (
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span className="contact-label">Address:</span>
              <span className="contact-value">{business.address}</span>
            </div>
          )}
          
          {business.working_hours && (
            <div className="contact-item">
              <span className="contact-icon">🕐</span>
              <span className="contact-label">Working Hours:</span>
              <span className="contact-value">{business.working_hours}</span>
            </div>
          )}
          
          {business.price_range && (
            <div className="contact-item">
              <span className="contact-icon">💰</span>
              <span className="contact-label">Price Range:</span>
              <span className="contact-value">{business.price_range}</span>
            </div>
          )}
        </div>
      </div>

      {/* Business Description Section */}
      {business.details && (
        <div className="business-details-section">
          <h2>About Business</h2>
          <div className="business-description">
            {business.details}
          </div>
        </div>
      )}

      {/* Created By Section */}
      <div className="business-details-footer">
        {business.created_at && (
          <p className="business-date">
            Listed on: {new Date(business.created_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}
          </p>
        )}
        
        <p className="business-author">
          Listed by:{" "}
          {createdByRef ? (
            <button
              type="button"
              className="author-link-btn"
              onClick={() => {
                if (createdByRef.username) {
                  sessionStorage.setItem("member_profile_username", createdByRef.username);
                }
                const params = new URLSearchParams();
                if (createdByRef.username) {
                  params.set("username", createdByRef.username);
                }
                navigate(`/memberdetails?${params.toString()}`);
              }}
            >
              {createdByRef.name}
            </button>
          ) : (
            "Unknown"
          )}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="business-detail-nav">
        <button
          type="button"
          className="nav-btn nav-prev"
          disabled={!previousSlug}
          onClick={() => navigate(`/business/${encodeURIComponent(previousSlug)}`)}
        >
          ← Previous Business
        </button>
        
        <button
          type="button"
          className="nav-btn nav-next"
          disabled={!nextSlug}
          onClick={() => navigate(`/business/${encodeURIComponent(nextSlug)}`)}
        >
          Next Business →
        </button>
      </div>
    </div>
  );
}

export default BusinessDetails;

