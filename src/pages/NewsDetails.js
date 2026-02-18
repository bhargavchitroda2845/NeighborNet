import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "./NewsDetails.css";
import { BASE_URL } from "../config/api";

function getCreatedByName(newsItem) {
  if (!newsItem) return "Unknown";

  if (
    typeof newsItem.created_by_profile?.full_name === "string" &&
    newsItem.created_by_profile.full_name.trim()
  ) {
    return newsItem.created_by_profile.full_name.trim();
  }

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

function getCreatedByRef(newsItem) {
  const name = getCreatedByName(newsItem);
  if (!name || name === "Unknown") {
    return null;
  }

  const idCandidates = [
    newsItem?.created_by_profile?.member_no,
    newsItem?.created_by_id,
    newsItem?.user_id,
    newsItem?.author_id,
    newsItem?.created_by?.id,
  ];
  const usernameCandidates = [
    newsItem?.created_by_profile?.username,
    newsItem?.created_by_username,
    newsItem?.username,
    newsItem?.created_by?.username,
  ];

  const memberId = idCandidates.find((value) => value !== null && value !== undefined && value !== "");
  const username = usernameCandidates.find(
    (value) => typeof value === "string" && value.trim()
  );

  return {
    name,
    memberId: memberId ?? null,
    username: username ? username.trim() : null,
  };
}

function getNewsSlug(newsRef) {
  if (!newsRef) return "";

  if (typeof newsRef === "string") {
    const raw = newsRef.trim();
    if (!raw) return "";
    try {
      const parsed = new URL(raw);
      const slugFromQuery =
        parsed.searchParams.get("news_slug") || parsed.searchParams.get("slug");
      return slugFromQuery ? slugFromQuery.trim() : "";
    } catch {
      return raw;
    }
  }

  if (typeof newsRef === "object") {
    if (typeof newsRef.slug === "string" && newsRef.slug.trim()) {
      return newsRef.slug.trim();
    }
    if (typeof newsRef.news_slug === "string" && newsRef.news_slug.trim()) {
      return newsRef.news_slug.trim();
    }
  }

  return "";
}

function NewsDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousNews, setPreviousNews] = useState(null);
  const [nextNews, setNextNews] = useState(null);

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
    setLoading(true);

    fetch(`${BASE_URL}/news/allpost/?news_slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("News not found");
        }
        return res.json();
      })
      .then((data) => {
        setNews(data.result || null);

        setPreviousNews(
          data.previous_item ||
            data.result?.previous_item ||
            data.previous ||
            data.prev ||
            data.previous_news ||
            data.result?.previous ||
            data.result?.previous_news ||
            null
        );
        setNextNews(
          data.next_item ||
            data.result?.next_item ||
            data.next ||
            data.next_news ||
            data.result?.next ||
            data.result?.next_news ||
            null
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error("News detail error:", err);
        setNews(null);
        setPreviousNews(null);
        setNextNews(null);
        setLoading(false);
      });
  }, [slug]);

  const previousSlug = getNewsSlug(previousNews);
  const nextSlug = getNewsSlug(nextNews);
  const createdByRef = getCreatedByRef(news);

  if (loading) {
    return <h2 style={{ padding: "30px" }}>Loading...</h2>;
  }

  if (!news) {
    return <h2 style={{ padding: "30px" }}>News not found</h2>;
  }

  return (
    <div
      className="news-detail"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <button
        type="button"
        className="news-back-btn"
        onClick={() => navigate("/news")}
      >
        Back to News
      </button>
      <h1>{news.title}</h1>

      <p className="news-date">
        {new Date(news.created_at).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}
      </p>
      <p className="news-author">
        Created by:{" "}
        {createdByRef ? (
          <button
            type="button"
            className="author-link-btn"
            onClick={() => {
              if (createdByRef.username) {
                sessionStorage.setItem("member_profile_username", createdByRef.username);
              }
              if (createdByRef.memberId !== null) {
                sessionStorage.setItem("member_profile_id", String(createdByRef.memberId));
              }
              sessionStorage.setItem("member_profile_name", createdByRef.name);
              const params = new URLSearchParams();
              params.set("full_name", createdByRef.name);
              if (createdByRef.memberId !== null) {
                params.set("id", String(createdByRef.memberId));
              }
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

      {news.image_url && <img src={news.image_url} alt={news.title} />}

      <div
        className="news-full-content"
        dangerouslySetInnerHTML={{ __html: news.content || "" }}
      />

      <div className="news-detail-nav">
        <button
          type="button"
          disabled={!previousSlug}
          onClick={() => navigate(`/news/${encodeURIComponent(previousSlug)}`)}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!nextSlug}
          onClick={() => navigate(`/news/${encodeURIComponent(nextSlug)}`)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default NewsDetail;
