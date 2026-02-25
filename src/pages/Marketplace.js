import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Marketplace.css";
import { BASE_URL, SOLD_COUNT_API_URL } from "../config/api";

const ITEMS_PER_PAGE = 12;

const Marketplace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [soldCount, setSoldCount] = useState(0);
  const getListingType = (item) => {
    // If item status is sold, show it as sold regardless of listing_type
    const itemStatus = String(item.status || "").trim().toLowerCase();
    if (itemStatus === "sold") {
      return "sold";
    }

    const rawType = String(item.listing_type || item.category || "")
      .trim()
      .toLowerCase();

    if (rawType === "buy") return "buyer";
    if (rawType === "sell") return "seller";
    if (rawType === "rental") return "rental";
    return rawType;
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setAppliedSearchQuery(searchQuery.trim());
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [category, appliedSearchQuery]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMarketplace = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          page_size: String(ITEMS_PER_PAGE),
        });

        if (category !== "all") {
          // When category is "sold", we need to filter by status, not listing_type
          if (category === "sold") {
            params.set("status", "sold");
          } else {
            params.set("category", category);
          }
        }

        const query = appliedSearchQuery.trim();
        if (query) {
          params.set("search", query);
        }

        const url = `${BASE_URL}/api/marketplace/?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        const result = await res.json();

        const items = Array.isArray(result) ? result : result.results || [];
        setData(items);

        if (Array.isArray(result)) {
          setTotalCount(result.length);
          setHasPrevious(currentPage > 1);
          setHasNext(false);
        } else {
          const count = Number(result.count);
          setTotalCount(Number.isFinite(count) ? count : items.length);
          setHasPrevious(Boolean(result.has_previous ?? result.previous));
          setHasNext(Boolean(result.has_next ?? result.next));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading data", err);
          setData([]);
          setTotalCount(0);
          setHasPrevious(false);
          setHasNext(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplace();

    return () => controller.abort();
  }, [currentPage, category, appliedSearchQuery, refreshTrigger]);

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / ITEMS_PER_PAGE) : 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!location.state?.refreshMarketplace) {
      return;
    }

    setCategory("all");
    setSearchQuery("");
    setAppliedSearchQuery("");
    setCurrentPage(1);
    setRefreshTrigger((prev) => prev + 1);
  }, [location.key, location.state]);

  // Fetch sold count on load
  useEffect(() => {
    const fetchSoldCount = async () => {
      try {
        const res = await fetch(SOLD_COUNT_API_URL);
        const data = await res.json();
        setSoldCount(data.total_sold || 0);
      } catch (err) {
        console.error("Error fetching sold count:", err);
      }
    };
    fetchSoldCount();
  }, []);

  return (
    <div
      className="buysell-container"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <h1>Marketplace</h1>

      {/* CATEGORY FILTER */}
      <div className="category-buttons">
        <button onClick={() => setCategory("all")}>All</button>
        <button onClick={() => setCategory("buyer")}>Buyers</button>
        <button onClick={() => setCategory("seller")}>Sellers</button>
        <button onClick={() => setCategory("rental")}>Rental</button>
        <button onClick={() => setCategory("sold")}>
          Sold {soldCount > 0 && <span className="category-count">({soldCount})</span>}
        </button>
      </div>

      <div className="marketplace-search-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Search..."
          aria-label="Search marketplace listings"
        />
        <button type="button" className="marketplace-search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* CARDS */}
      <div className="card-grid">
        {loading ? (
          <p>Loading...</p>
        ) : data.length === 0 ? (
          <p>No data found</p>
        ) : (
          data.map((item) => (
            <div
              className="card"
              key={item.id}
              onClick={() => navigate(`/marketplace/${item.id}`)}
            >
              <span className={`tag ${getListingType(item)}`}>
                {(item.listing_type_label || getListingType(item) || "N/A").toUpperCase()}
              </span>

              {item.image_url || item.image ? (
                <img src={item.image_url || item.image} alt={item.title} />
              ) : (
                <div className="card-image-empty" aria-hidden="true" />
              )}
              <div className="card-content">
                <h3>{item.title}</h3>
                <p className="price">
                  {item.price
                    ? `Rs ${item.price}`
                    : item.min_price || item.max_price
                    ? `Rs ${item.min_price || 0} - Rs ${item.max_price || 0}`
                    : "Price not specified"}
                </p>
                <p className="location">{item.area || item.location || "Location not specified"}</p>
                <p className="contact">Contact: {item.contact || "N/A"}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {data.length > 0 ? (
        <div className="marketplace-pagination">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={!hasPrevious}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={!hasNext}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Marketplace;
