import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./MarketplaceDetails.css";
import { BASE_URL, BID_PLACE_API_URL, BID_GET_API_URL, BID_MANAGE_API_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

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

  const memberId = idCandidates.find(
    (value) => value !== null && value !== undefined && value !== ""
  );

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
  const { member, isAuthenticated } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousItem, setPreviousItem] = useState(null);
  const [nextItem, setNextItem] = useState(null);

  // Bidding state
  const [bids, setBids] = useState([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [hasAlreadyBid, setHasAlreadyBid] = useState(false);
  const [hasWinner, setHasWinner] = useState(false);
  const [winningBid, setWinningBid] = useState(null);

  // ✅ Default Location (Ahmedabad)
  const DEFAULT_LAT = 47.6041;
  const DEFAULT_LNG = -122.329;

  // Fetch item details
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

  // Fetch bids when item is loaded
  useEffect(() => {
    if (item && item.bidding_enabled) {
      setBidsLoading(true);
      fetch(BID_GET_API_URL(item.id), {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          setBids(data.bids || []);
          // Check if current user has already bid
          if (member && data.bids) {
            const userBid = data.bids.find(b =>
              b.bidder && b.bidder.username === member.member?.username
            );
            setHasAlreadyBid(!!userBid);
          }
          // Check if there's a winner
          const winner = data.bids.find(b => b.is_winner === true);
          if (winner) {
            setHasWinner(true);
            setWinningBid(winner);
          } else {
            setHasWinner(false);
            setWinningBid(null);
          }
          setBidsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching bids:", err);
          setBidsLoading(false);
        });
    }
  }, [item, member]);

  // Handle placing a bid
  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setBidError("");
    setBidSuccess("");
    setBidSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("item_id", item.id);
      formData.append("bid_amount", bidAmount);
      if (bidMessage) formData.append("message", bidMessage);

      const response = await fetch(BID_PLACE_API_URL, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setBidSuccess(data.message);
        setBidAmount("");
        setBidMessage("");
        // Refresh bids
        const bidsRes = await fetch(BID_GET_API_URL(item.id), {
          credentials: 'include',
        });
        const bidsData = await bidsRes.json();
        setBids(bidsData.bids || []);
        setTimeout(() => {
          setShowBidModal(false);
          setBidSuccess("");
        }, 2000);
      } else {
        setBidError(data.detail || data.message || "Failed to place bid");
      }
    } catch (err) {
      setBidError("An error occurred while placing bid");
      console.error(err);
    } finally {
      setBidSubmitting(false);
    }
  };

  // Handle accept/reject bid (for item owner)
  const handleManageBid = async (bidId, action) => {
    try {
      const formData = new FormData();
      formData.append("action", action);

      const response = await fetch(BID_MANAGE_API_URL(bidId), {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Refresh bids
        const bidsRes = await fetch(BID_GET_API_URL(item.id), {
          credentials: 'include',
        });
        const bidsData = await bidsRes.json();
        setBids(bidsData.bids || []);
      } else {
        alert(data.detail || "Failed to manage bid");
      }
    } catch (err) {
      console.error("Error managing bid:", err);
      alert("An error occurred");
    }
  };

  // Check if current user is the owner
  const isOwner = useMemo(() => {
    if (!member || !item || !item.created_by_profile) return false;
    return member.member?.username === item.created_by_profile.username;
  }, [member, item]);

  const listingLabel = useMemo(() => {
    if (!item) return "N/A";
    return item.listing_type_label || normalizeListingType(item).toUpperCase();
  }, [item]);

  const listingType = useMemo(() => {
    if (!item) return "";
    return normalizeListingType(item);
  }, [item]);

  const createdByRef = useMemo(() => getCreatedByRef(item), [item]);

  // ✅ Use backend lat/lng if available else default
  const latitude = item?.latitude || DEFAULT_LAT;
  const longitude = item?.longitude || DEFAULT_LNG;

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

  const handleBidButtonClick = () => {
    if (!isAuthenticated) {
      // Store the intended URL to redirect back after login
      const currentUrl = `/marketplace/${id}`;
      sessionStorage.setItem('redirectAfterLogin', currentUrl);
      navigate("/member-login");
      return;
    }
    setShowBidModal(true);
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
            <img
              src={item.image_url}
              alt={item.title}
              className="marketplace-details-image"
            />
          ) : (
            <div
              className="marketplace-details-image-empty"
              aria-hidden="true"
            />
          )}

          <div className="marketplace-details-content">
            <h1>{item.title}</h1>
            <span className={`marketplace-type-chip ${listingType}`}>
              {listingLabel}
            </span>

            <div className="marketplace-details-grid">
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
                        sessionStorage.setItem(
                          "member_profile_username",
                          createdByRef.username
                        );
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

              <p><strong>Created At:</strong> {formatDateTime(item.created_at)}</p>
            </div>

            <div className="marketplace-description">
              <h3>Description</h3>
              <p>{item.desc || "No description available."}</p>
            </div>

            {/* Bidding Section */}
            {item.bidding_enabled && (
              <div className="bidding-section">
                <h3>💰 Bidding</h3>

                {/* Show winner info if there's a winner */}
                {hasWinner && winningBid && (
                  <div className="winner-announcement">
                    <span className="winner-badge">🏆 Winner Selected!</span>
                    <p>
                      <strong>{winningBid.bidder?.full_name || winningBid.bidder?.username || "Anonymous"}</strong> 
                      {' '}has won with a bid of{' '}
                      <strong>Rs {winningBid.bid_amount}</strong>
                    </p>
                  </div>
                )}

                {!isOwner && !hasAlreadyBid && !hasWinner && (
                  <button 
                    className="bid-button"
                    onClick={handleBidButtonClick}
                  >
                    Place Bid
                  </button>
                )}

                {hasAlreadyBid && (
                  <p className="bid-already-placed">You have already placed a bid on this item</p>
                )}

                {hasWinner && !isOwner && (
                  <p className="bid-closed">Bidding is closed - a winner has been selected</p>
                )}

                {isOwner && <p className="bid-owner-notice">This is your listing</p>}

                {/* Bids List */}
                <div className="bids-list">
                  <h4>Current Bids ({bids.length})</h4>
                  {bidsLoading ? (
                    <p>Loading bids...</p>
                  ) : bids.length === 0 ? (
                    <p>No bids yet</p>
                  ) : (
                    <div className="bids-container">
                      {bids.map((bid) => (
                        <div key={bid.id} className={`bid-item bid-status-${bid.status} ${bid.is_winner ? 'winner' : ''}`}>
                          <div className="bid-info">
                            <span className="bid-amount">Rs {bid.bid_amount}</span>
                            <span className="bid-bidder">{bid.bidder?.full_name || "Anonymous"}</span>
                            <span className="bid-date">{formatDateTime(bid.created_at)}</span>
                            {bid.message && <p className="bid-message">"{bid.message}"</p>}
                          </div>
                          {isOwner && bid.status === "pending" && (
                            <div className="bid-actions">
                              <button
                                className="bid-accept-btn"
                                onClick={() => handleManageBid(bid.id, "accept")}
                              >
                                Accept
                              </button>
                              <button
                                className="bid-reject-btn"
                                onClick={() => handleManageBid(bid.id, "reject")}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          <span className={`bid-status-badge ${bid.status}`}>
                            {bid.is_winner ? "🏆 Winner" : bid.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ✅ Google Map Section */}
            <div className="marketplace-map">
              <h3>Location</h3>
              <iframe
                title="Marketplace Location"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: "12px" }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`}
              ></iframe>
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

      {/* Bid Modal */}
      {showBidModal && (
        <div className="bid-modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="bid-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bid-modal-header">
              <h3>Place Your Bid</h3>
              <button className="bid-modal-close" onClick={() => setShowBidModal(false)}>×</button>
            </div>

            {item.image_url && (
              <div className="bid-modal-item">
                <img src={item.image_url} alt={item.title} />
                <div>
                  <h4>{item.title}</h4>
                  <p>Min: Rs {item.min_price || 0}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePlaceBid}>
              <div className="bid-form-group">
                <label>Your Bid Amount (Rs)</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={`Min: ${item.min_price || 0}`}
                  required
                  min={item.min_price || 1}
                />
              </div>

              <div className="bid-form-group">
                <label>Message (Optional)</label>
                <textarea
                  value={bidMessage}
                  onChange={(e) => setBidMessage(e.target.value)}
                  placeholder="Add a message to your bid..."
                  rows={3}
                />
              </div>

              {bidError && <div className="bid-error">{bidError}</div>}
              {bidSuccess && <div className="bid-success">{bidSuccess}</div>}

              <div className="bid-modal-actions">
                <button
                  type="button"
                  className="bid-cancel-btn"
                  onClick={() => setShowBidModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bid-submit-btn"
                  disabled={bidSubmitting}
                >
                  {bidSubmitting ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketplaceDetails;
