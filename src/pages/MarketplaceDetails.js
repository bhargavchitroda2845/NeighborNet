import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./MarketplaceDetails.css";
import { BASE_URL } from "../config/api";

function formatDateTime(value) {
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function normalizeListingType(item) {
  const rawType = String(item?.listing_type || item?.category || "")
    .trim()
    .toLowerCase();

  if (rawType === "buy") return "buyer";
  if (rawType === "sell") return "seller";
  if (rawType === "rental") return "rental";
  return rawType || "N/A";
}

function joinNameParts(...parts) {
  return parts
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trim())
    .join(" ")
    .trim();
}

function getCreatedByRef(item) {
  if (!item) return null;

  const fullNameFromProfile = joinNameParts(
    item.created_by_profile?.first_name,
    item.created_by_profile?.middle_name,
    item.created_by_profile?.surname
  );

  const fullNameFromTopLevel = joinNameParts(
    item.created_by_first_name || item.first_name,
    item.created_by_middle_name || item.middle_name,
    item.created_by_surname || item.surname
  );

  const fullNameFromObject = joinNameParts(
    item.created_by?.first_name,
    item.created_by?.middle_name,
    item.created_by?.surname
  );

  const nameCandidates = [
    item.created_by_profile?.full_name,
    fullNameFromProfile,
    fullNameFromTopLevel,
    fullNameFromObject,
    item.created_by_name,
    item.created_by?.full_name,
    item.created_by?.name,
    item.created_by?.username,
    item.created_by,
  ];

  const name = nameCandidates.find(
    (value) => typeof value === "string" && value.trim()
  );

  if (!name) return null;

  const idCandidates = [
    item.created_by_profile?.member_no,
    item.created_by_id,
    item.user_id,
    item.created_by?.id,
  ];
  const usernameCandidates = [
    item.created_by_profile?.username,
    item.created_by_username,
    item.username,
    item.created_by?.username,
    typeof item.created_by === "string" && !item.created_by.includes(" ")
      ? item.created_by
      : null,
  ];

  const memberId = idCandidates.find((value) => value !== null && value !== undefined && value !== "");
  const username = usernameCandidates.find(
    (value) => typeof value === "string" && value.trim()
  );

  return {
    name: name.trim(),
    memberId: memberId ?? null,
    username: username ? username.trim() : null,
  };
}

function MarketplaceDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousItem, setPreviousItem] = useState(null);
  const [nextItem, setNextItem] = useState(null);

  useEffect(() => {
    setLoading(true);

    fetch(`${BASE_URL}/api/marketplace/?id=${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load marketplace details");
        }
        return res.json();
      })
      .then((result) => {
        const selected =
          result?.result ||
          (Array.isArray(result) ? result[0] : null) ||
          (Array.isArray(result?.results) ? result.results[0] : null);

        // API can provide direct neighbors for detail navigation.
        setPreviousItem(result?.previous_item || null);
        setNextItem(result?.next_item || null);
        setItem(selected || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Marketplace details error:", err);
        setItem(null);
        setPreviousItem(null);
        setNextItem(null);
        setLoading(false);
      });
  }, [id]);

  const listingLabel = useMemo(() => {
    if (!item) return "N/A";
    return item.listing_type_label || normalizeListingType(item).toUpperCase();
  }, [item]);

  const listingType = useMemo(() => {
    if (!item) return "";
    return normalizeListingType(item);
  }, [item]);
  const createdByRef = useMemo(() => getCreatedByRef(item), [item]);

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

  if (loading) {
    return <h2 style={{ padding: "30px" }}>Loading...</h2>;
  }

  if (!item) {
    return <h2 style={{ padding: "30px" }}>Marketplace item not found</h2>;
  }

  return (
    <div
      className="marketplace-details-page"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <div className="marketplace-details-wrap">
        <button
          type="button"
          className="marketplace-back-btn"
          onClick={() => navigate("/marketplace")}
        >
          Back to Marketplace
        </button>

        <div className="marketplace-details-card">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="marketplace-details-image" />
          ) : (
            <div className="marketplace-details-image-empty" aria-hidden="true" />
          )}

          <div className="marketplace-details-content">
            <h1>{item.title}</h1>
            <span className={`marketplace-type-chip ${listingType}`}>{listingLabel}</span>

            <div className="marketplace-details-grid">
              {/* <p><strong>Slug:</strong> {item.slug || "N/A"}</p> */}
              <p><strong>Area:</strong> {item.area || "N/A"}</p>
              <p><strong>Contact:</strong> {item.contact || "N/A"}</p>
              <p><strong>Price:</strong> {item.price ? `Rs ${item.price}` : "N/A"}</p>
              <p><strong>Min Price:</strong> {item.min_price ? `Rs ${item.min_price}` : "N/A"}</p>
              <p><strong>Max Price:</strong> {item.max_price ? `Rs ${item.max_price}` : "N/A"}</p>
              <p>
                <strong>Created By:</strong>{" "}
                {createdByRef ? (
                  <button
                    type="button"
                    className="author-link-btn"
                    onClick={() => {
                      if (createdByRef.username) {
                        sessionStorage.setItem("member_profile_username", createdByRef.username);
                      }
                      sessionStorage.removeItem("member_profile_source");
                      sessionStorage.removeItem("member_profile_listing_id");

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
                  "N/A"
                )}
              </p>
              {/* <p><strong>Updated By:</strong> {item.updated_by || "N/A"}</p> */}
              <p><strong>Created At:</strong> {formatDateTime(item.created_at)}</p>
              {/* <p><strong>Updated At:</strong> {formatDateTime(item.updated_at)}</p> */}
              {/* <p><strong>Line No:</strong> {item.line_no ?? "N/A"}</p> */}
            </div>

            <div className="marketplace-description">
              <h3>Description</h3>
              <p>{item.desc || "No description available."}</p>
            </div>

            <div className="marketplace-detail-nav">
              <button
                type="button"
                disabled={!previousItem}
                onClick={() => navigate(`/marketplace/${previousItem.id}`)}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!nextItem}
                onClick={() => navigate(`/marketplace/${nextItem.id}`)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceDetails;
