import "./News.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BASE_URL } from "../config/api";

const CATEGORY_STORAGE_KEY = "news_selected_category";

function getCreatedByName(newsItem) {
  if (!newsItem) return "Unknown";

  if (
    typeof newsItem.created_by_name === "string" &&
    newsItem.created_by_name.trim()
  ) {
    return newsItem.created_by_name.trim();
  }

  if (typeof newsItem.created_by === "string" && newsItem.created_by.trim()) {
    return newsItem.created_by.trim();
  }

  if (newsItem.created_by && typeof newsItem.created_by === "object") {
    const createdByObject =
      newsItem.created_by.full_name ||
      newsItem.created_by.name ||
      newsItem.created_by.username;

    if (typeof createdByObject === "string" && createdByObject.trim()) {
      return createdByObject.trim();
    }
  }

  const fallbackFields = [
    newsItem.author_name,
    newsItem.author,
    newsItem.posted_by,
    newsItem.user_name,
    newsItem.username,
  ];

  for (const field of fallbackFields) {
    if (typeof field === "string" && field.trim()) {
      return field.trim();
    }
  }

  return "Unknown";
}

function getCategoryName(newsItem) {
  if (!newsItem) return "";

  if (typeof newsItem.category === "string") {
    return newsItem.category.toLowerCase();
  }

  if (newsItem.category && typeof newsItem.category === "object") {
    if (typeof newsItem.category.name === "string") {
      return newsItem.category.name.toLowerCase();
    }
  }

  if (typeof newsItem.category_name === "string") {
    return newsItem.category_name.toLowerCase();
  }

  return "";
}

function News() {
  const [newsData, setNewsData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem(CATEGORY_STORAGE_KEY) || "all";
  });
  const [appliedCategory, setAppliedCategory] = useState(() => {
    return localStorage.getItem(CATEGORY_STORAGE_KEY) || "all";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const filteredNewsData = useMemo(() => {
    const query = appliedSearchQuery.toLowerCase();
    const category = appliedCategory.toLowerCase();

    return newsData.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const slug = (item.slug || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      const content = (item.content || "").toLowerCase();
      const itemCategory = getCategoryName(item);

      const matchesSearch =
        !query ||
        title.includes(query) ||
        slug.includes(query) ||
        description.includes(query) ||
        content.includes(query);

      const matchesCategory = category === "all" || itemCategory === category;

      return matchesSearch && matchesCategory;
    });
  }, [newsData, appliedSearchQuery, appliedCategory]);

  const handleSearch = () => {
    setPage(1);
    setAppliedCategory(selectedCategory);

    setAppliedSearchQuery(searchQuery.trim());
    setSearchTrigger((prev) => prev + 1);
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
    localStorage.setItem(CATEGORY_STORAGE_KEY, selectedCategory);
  }, [selectedCategory]);

  /* Fetch categories */
  useEffect(() => {
    fetch(`${BASE_URL}/news/categories/`)
      .then((res) => res.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : data.results || []);
      })
      .catch((err) => console.error("Category error:", err));
  }, []);

  /* Fetch news */
  useEffect(() => {
    const controller = new AbortController();

    const fetchNews = async () => {
      try {
        const params = new URLSearchParams({
          page_size: String(appliedSearchQuery ? 100 : pageSize),
        });

        if (appliedCategory !== "all") {
          params.set("category", appliedCategory);
        }

        if (appliedSearchQuery) {
          let currentPage = 1;
          let keepFetching = true;
          let allNews = [];

          while (keepFetching) {
            params.set("page", String(currentPage));
            const url = `${BASE_URL}/news/allpost/?${params.toString()}`;
            const res = await fetch(url, { signal: controller.signal });
            const data = await res.json();

            allNews = allNews.concat(data.results || []);
            keepFetching = Boolean(data.has_next);
            currentPage += 1;
          }

          setNewsData(allNews);
          setHasNext(false);
          setHasPrevious(false);
          return;
        }

        params.set("page", String(page));
        const url = `${BASE_URL}/news/allpost/?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        setNewsData(data.results || []);
        setHasNext(data.has_next);
        setHasPrevious(data.has_previous);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("News error:", err);
        }
      }
    };

    fetchNews();

    return () => controller.abort();
  }, [page, pageSize, appliedCategory, appliedSearchQuery, searchTrigger]);

  useEffect(() => {
    if (!location.state?.refreshNews) {
      return;
    }

    setSelectedCategory("all");
    setAppliedCategory("all");
    setSearchQuery("");
    setAppliedSearchQuery("");
    setPage(1);
    localStorage.setItem(CATEGORY_STORAGE_KEY, "all");
    setSearchTrigger((prev) => prev + 1);
  }, [location.key, location.state]);

  return (
    <div
      className="news-page"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <h1>Community News</h1>

      {/* FILTER SECTION */}
      <div className="filter-box">

        {/* 🔎 SEARCH BAR */}
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="search-input"
        />

        {/* CATEGORY FILTER */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="search-btn"
          onClick={handleSearch}
        >
          Search
        </button>

        {/* PAGE SIZE */}
        {/* <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select> */}
      </div>

      {/* NEWS GRID */}
      <div className="news-grid">
        {filteredNewsData.length === 0 ? (
          <p style={{ textAlign: "center" }}>No news found</p>
        ) : (
          filteredNewsData.map((news) => (
            <div
              className="news-card"
              key={news.id}
              onClick={() => navigate(`/news/${encodeURIComponent(news.slug)}`)}
            >
              {news.image_url ? (
                <img src={news.image_url} alt={news.title} />
              ) : (
                <div className="news-image-empty" aria-hidden="true" />
              )}

              <div className="news-content">
                <h3>{news.title}</h3>

                <p className="news-date">
                  
                  <p className="news-date">
                    {new Date(news.created_at).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>

                </p>
                <p className="news-author">
                  Created by: {getCreatedByName(news)}
                </p>

                <p>{news.description}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button
          disabled={!hasPrevious}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </button>

        <span>Page {page}</span>

        <button
          disabled={!hasNext}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default News;

