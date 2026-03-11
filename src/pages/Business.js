import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Business.css";
import { BUSINESS_LIST_API_URL, BUSINESS_CATEGORIES_API_URL } from "../config/api";

const ITEMS_PER_PAGE = 12;

const Business = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [appliedCategory, setAppliedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Fetch categories and businesses from Django API
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch categories
        const categoriesRes = await fetch(BUSINESS_CATEGORIES_API_URL);
        const categoriesData = await categoriesRes.json();
        
        if (categoriesData.results) {
          setCategories(categoriesData.results);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading business data", err);
        setError("Failed to load business data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch businesses with pagination and search
  useEffect(() => {
    const controller = new AbortController();

    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          page_size: String(ITEMS_PER_PAGE),
        });

        if (appliedCategory !== "all") {
          params.set("category", appliedCategory);
        }

        if (appliedSearchQuery) {
          params.set("search", appliedSearchQuery);
        }

        const url = `${BUSINESS_LIST_API_URL}?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        if (data.results) {
          setBusinesses(data.results);
          setHasNext(data.has_next || false);
          setHasPrevious(data.has_previous || false);
          setTotalCount(data.count || 0);
        } else {
          setBusinesses([]);
          setHasNext(false);
          setHasPrevious(false);
          setTotalCount(0);
        }
        
        setLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading businesses", err);
          setError("Failed to load businesses. Please try again later.");
        }
        setLoading(false);
      }
    };

    fetchBusinesses();

    return () => controller.abort();
  }, [page, appliedCategory, appliedSearchQuery]);

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

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleApplyFilter = () => {
    setAppliedCategory(selectedCategory);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery.trim());
    setPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCardClick = (slug) => {
    navigate(`/business/${slug}`);
  };

  if (loading && businesses.length === 0) {
    return (
      <div className="business-container">
        <h1>Local Businesses & Services</h1>
        <div className="loading">Loading businesses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="business-container">
        <h1>Local Businesses & Services</h1>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div 
      className="business-container"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <h1>Local Businesses & Services</h1>

      {/* SEARCH BAR */}
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          className="search-input"
        />
        <button className="search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* CATEGORY DROPDOWN */}
      <div className="category-filter">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        <button className="filter-btn" onClick={handleApplyFilter}>
          Filter
        </button>
      </div>

      {/* BUSINESS CARDS - Fixed Size Compact Design */}
      <div className="card-grid">
        {businesses.length === 0 ? (
          <p className="no-businesses">No businesses found</p>
        ) : (
          businesses.map((biz) => (
            <div 
              className="business-card" 
              key={biz.id}
              onClick={() => handleCardClick(biz.slug)}
            >
              {/* Category Badge */}
              {(biz.category || biz.category_icon) && (
                <div className="card-category-badge">
                  {biz.category_icon && <span className="category-icon">{biz.category_icon}</span>}
                  <span className="category-name">{biz.category}</span>
                </div>
              )}
              
              {/* Image */}
              <div className="card-image">
                {biz.image_url ? (
                  <img src={biz.image_url} alt={biz.name} />
                ) : (
                  <div className="card-image-placeholder">
                    <span className="placeholder-icon">🏪</span>
                  </div>
                )}
              </div>
              
              {/* Card Content - Only Required Fields */}
              <div className="card-content">
                <h3 className="business-name">{biz.name}</h3>
                
                {biz.service && (
                  <p className="service-type">
                    <span className="label">Service:</span> {biz.service}
                  </p>
                )}
                
                {biz.area && (
                  <p className="area">
                    <span className="label">Area:</span> {biz.area}
                  </p>
                )}
                
                {biz.phone && (
                  <p className="contact">
                    <span className="label">Contact:</span> {biz.phone}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {totalCount > 0 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={!hasPrevious}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {page} ({totalCount} businesses)
          </span>
          
          <button
            className="pagination-btn"
            disabled={!hasNext}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Business;

