import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { CAREER_POSTS_API_URL } from "../config/api";
import "./Career.css";

const PAGE_SIZE = 9;

function Career() {
  const location = useLocation();
  const navigate = useNavigate();

  const [careerPosts, setCareerPosts] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [appliedType, setAppliedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCareerPosts = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(PAGE_SIZE),
        });

        if (appliedType !== "all") {
          params.set("post_type", appliedType);
        }

        if (appliedSearchQuery.trim()) {
          params.set("search", appliedSearchQuery.trim());
        }

        const response = await fetch(`${CAREER_POSTS_API_URL}?${params.toString()}`, {
          signal: controller.signal,
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to load career posts");
        }

        setCareerPosts(Array.isArray(data.results) ? data.results : []);
        setTotalCount(Number.isFinite(Number(data.count)) ? Number(data.count) : (Array.isArray(data.results) ? data.results.length : 0));
        setHasNext(Boolean(data.has_next));
        setHasPrevious(Boolean(data.has_previous));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setCareerPosts([]);
          setTotalCount(0);
          setHasNext(false);
          setHasPrevious(false);
          setError(fetchError.message || "Failed to load career posts");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCareerPosts();

    return () => controller.abort();
  }, [page, appliedType, appliedSearchQuery]);

  useEffect(() => {
    if (!location.state?.refreshCareer) {
      return;
    }

    setSelectedType("all");
    setAppliedType("all");
    setSearchQuery("");
    setAppliedSearchQuery("");
    setPage(1);
  }, [location.key, location.state]);

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

  const handleSearch = () => {
    setPage(1);
    setAppliedType(selectedType);
    setAppliedSearchQuery(searchQuery.trim());
  };

  const handleTypeFilter = (type) => {
    setPage(1);
    setSelectedType(type);
    setAppliedType(type);
  };

  const clearFilters = () => {
    setPage(1);
    setSelectedType("all");
    setAppliedType("all");
    setSearchQuery("");
    setAppliedSearchQuery("");
  };

  return (
    <div
      className="career-container"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <h1>Career</h1>
      <p className="career-subtitle">Verified career posts from members.</p>

      <div className="career-category-buttons" role="group" aria-label="Career post type filter">
        <button
          type="button"
          className={selectedType === "all" ? "active" : ""}
          onClick={() => handleTypeFilter("all")}
        >
          All Posts
        </button>
        <button
          type="button"
          className={selectedType === "job_seeker" ? "active" : ""}
          onClick={() => handleTypeFilter("job_seeker")}
        >
          Job Seekers
        </button>
        <button
          type="button"
          className={selectedType === "recruiter" ? "active" : ""}
          onClick={() => handleTypeFilter("recruiter")}
        >
          Recruiters
        </button>
      </div>

      <div className="career-search-wrap">
        <input
          type="text"
          placeholder="Search by title, skills, company, location"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          aria-label="Search career posts"
        />

        <button type="button" className="career-search-btn" onClick={handleSearch}>
          Search
        </button>
        <button type="button" className="career-search-btn secondary" onClick={clearFilters}>
          Clear
        </button>
      </div>

      <div className="career-result-bar">
        <span>{totalCount} post{totalCount === 1 ? "" : "s"} found</span>
        {(appliedType !== "all" || appliedSearchQuery) && (
          <span className="career-active-filter">
            Active: {appliedType === "all" ? "All" : appliedType === "job_seeker" ? "Job Seekers" : "Recruiters"}
            {appliedSearchQuery ? ` | "${appliedSearchQuery}"` : ""}
          </span>
        )}
      </div>

      {loading ? (
        <p className="career-status">Loading career posts...</p>
      ) : error ? (
        <p className="career-status career-error">{error}</p>
      ) : careerPosts.length === 0 ? (
        <p className="career-status">No career posts found.</p>
      ) : (
        <div className="career-grid">
          {careerPosts.map((post) => (
            <button
              type="button"
              key={post.id}
              className="career-card"
              onClick={() => navigate(`/career/${post.id}`)}
            >
              <span className={`career-tag ${post.post_type}`}>{post.post_type_label}</span>

              <div className="career-card-image">
                {post.image_url ? (
                  <img src={post.image_url} alt={post.full_name || post.title} loading="lazy" decoding="async" />
                ) : (
                  <div className="career-image-empty" aria-hidden="true">
                    {(post.full_name || post.title || "C").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="career-card-content">
                <h3>{post.title || "Career Post"}</h3>
                <p className="career-name">{post.full_name || "Unknown"}</p>
                {post.location && <p className="career-meta-line"><span>Location</span>{post.location}</p>}
                {post.current_company_name && <p className="career-meta-line"><span>Current Company</span>{post.current_company_name}</p>}
                {!post.current_company_name && post.company_name && (
                  <p className="career-meta-line"><span>Company</span>{post.company_name}</p>
                )}

                <div className="career-card-footer">
                  {(post.package_lpa || post.expected_lpa || post.current_ctc_lpa) ? (
                    <span className="career-ctc-chip">
                      {(post.package_lpa || post.expected_lpa || post.current_ctc_lpa)} (LPA)
                    </span>
                  ) : (
                    <span className="career-ctc-chip muted">CTC Not Shared</span>
                  )}
                  <span className="career-view-link">View Details</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="career-pagination">
        <button
          type="button"
          disabled={!hasPrevious}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          type="button"
          disabled={!hasNext}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Career;
