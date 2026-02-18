import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./Business.css";

const Business = () => {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/data/businessData.json")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories);
        setBusinesses(data.businesses);
      })
      .catch((err) => console.error("Error loading business data", err));
  }, []);

  useEffect(() => {
    if (!location.state?.refreshBusiness) {
      return;
    }

    setSelectedCategory("all");
  }, [location.key, location.state]);

  const filteredBusinesses =
    selectedCategory === "all"
      ? businesses
      : businesses.filter(
          (item) => item.category === selectedCategory
        );

  return (
    <div className="business-container">
      <h1>Local Businesses & Services</h1>

      {/* CATEGORY DROPDOWN */}
      <div className="category-filter">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* BUSINESS CARDS */}
      <div className="card-grid">
        {filteredBusinesses.length === 0 ? (
          <p>No businesses found</p>
        ) : (
          filteredBusinesses.map((biz) => (
            <div className="card" key={biz.id}>
              <img src={biz.image} alt={biz.name} />
              <div className="card-content">
                <span className="tag">{biz.service}</span>
                <h3>{biz.name}</h3>
                <p className="location">📍 {biz.location}</p>
                <p className="phone">📞 {biz.phone}</p>
                <p className="rating">⭐ {biz.rating}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Business;
