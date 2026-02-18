import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MemberDetails.css";
import { PUBLIC_PROFILE_API_URL } from "../config/api";


function extractProfilePayload(data) {
  if (!data || typeof data !== "object") return null;

  if (data.member && typeof data.member === "object") {
    return {
      member: data.member,
      counts: data.counts || {},
      latest_detail: data.latest_detail || null,
      latest_news: data.latest_news || null,
      latest_listing: data.latest_listing || null,
    };
  }

  if (data.result && typeof data.result === "object") {
    if (data.result.member && typeof data.result.member === "object") {
      return {
        member: data.result.member,
        counts: data.result.counts || data.counts || {},
        latest_detail: data.result.latest_detail || data.latest_detail || null,
        latest_news: data.result.latest_news || data.latest_news || null,
        latest_listing: data.result.latest_listing || data.latest_listing || null,
      };
    }

    if (data.result.username || data.result.full_name || data.result.member_no) {
      return {
        member: data.result,
        counts: data.counts || {},
        latest_detail: data.latest_detail || null,
        latest_news: data.latest_news || null,
        latest_listing: data.latest_listing || null,
      };
    }
  }

  if (data.username || data.full_name || data.member_no) {
    return {
      member: data,
      counts: data.counts || {},
      latest_detail: data.latest_detail || null,
      latest_news: data.latest_news || null,
      latest_listing: data.latest_listing || null,
    };
  }

  return null;
}

function MemberDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tempName = sessionStorage.getItem("member_profile_name") || "";
  const tempUsername = sessionStorage.getItem("member_profile_username") || "";
  const tempMemberId = sessionStorage.getItem("member_profile_id") || "";
  const memberFullName = query.get("full_name") || query.get("name") || tempName || "Unknown Member";
  const memberId = query.get("id") || tempMemberId || null;
  const memberUsernameFromQuery = query.get("username") || tempUsername || "";

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
    const controller = new AbortController();

    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      setMemberData(null);

      try {
        const resolvedUsername = memberUsernameFromQuery.trim();
        const resolvedMemberId = memberId ? String(memberId).trim() : "";
        const resolvedName = memberFullName.trim();

        const candidateParams = [];
        if (resolvedUsername) {
          candidateParams.push({ key: "username", value: resolvedUsername });
        }
        if (resolvedMemberId) {
          candidateParams.push({ key: "id", value: resolvedMemberId });
          candidateParams.push({ key: "member_no", value: resolvedMemberId });
        }
        if (resolvedName && resolvedName !== "Unknown Member") {
          candidateParams.push({ key: "full_name", value: resolvedName });
          candidateParams.push({ key: "name", value: resolvedName });
          candidateParams.push({ key: "created_by_name", value: resolvedName });
        }

        if (candidateParams.length === 0) {
          throw new Error("Username or member id not found.");
        }

        let profilePayload = null;
        let lastStatus = null;
        for (const candidate of candidateParams) {
          const url = `${PUBLIC_PROFILE_API_URL}?${candidate.key}=${encodeURIComponent(candidate.value)}`;
          const res = await fetch(url, {
            signal: controller.signal,
            credentials: "omit",
          });
          lastStatus = res.status;

          if (!res.ok) {
            continue;
          }

          const data = await res.json();
          const parsedPayload = extractProfilePayload(data);
          if (!parsedPayload) {
            continue;
          }

          profilePayload = parsedPayload;
          break;
        }

        if (!profilePayload) {
          throw new Error(
            lastStatus ? `Profile request failed (${lastStatus})` : "Member profile not found"
          );
        }

        if (!profilePayload.member.username && resolvedUsername) {
          profilePayload.member.username = resolvedUsername;
        }
        setMemberData(profilePayload);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Member profile error:", err);
        setError(err.message || "Unable to load member profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [memberUsernameFromQuery, memberId, memberFullName]);

  const member = memberData?.member || null;
  const counts = memberData?.counts || {};

  return (
    <div
      className="member-details-page"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <div className="member-details-card">
        <button
          type="button"
          className="member-back-btn"
          onClick={() => navigate(-1)}
        >
          Back
        </button>

        <h1>Member Details</h1>

        {loading ? (
          <p className="member-note">Loading member profile...</p>
        ) : error ? (
          <>
            <p className="member-error">{error}</p>
            <div className="member-info-grid">
              <p><strong>Name:</strong> {memberFullName}</p>
              <p><strong>Member ID:</strong> {memberId || "Not provided"}</p>
              <p><strong>Username:</strong> {memberUsernameFromQuery || "Not provided"}</p>
            </div>
          </>
        ) : !member ? (
          <p className="member-error">Member profile not found.</p>
        ) : (
          <>
            <div className="member-header">
              {member.profile_image_url ? (
                <img src={member.profile_image_url} alt={member.full_name || member.username} />
              ) : (
                <div className="member-avatar-empty" aria-hidden="true" />
              )}
              <div>
                <h2>{member.full_name || memberFullName}</h2>
                <p className="member-note">
                  @{member.username || memberUsernameFromQuery || "unknown"} | {member.status || "N/A"}
                </p>
              </div>
            </div>

            <div className="member-info-grid">
              {/* <p><strong>Member No:</strong> {member.member_no ?? memberId ?? "N/A"}</p> */}
              <p><strong>Email:</strong> {member.email_id || "N/A"}</p>
              <p><strong>Phone:</strong> {member.phone_no || "N/A"}</p>
              <p><strong>DOB:</strong> {member.date_of_birth || "N/A"}</p>
              <p><strong>Age:</strong> {member.age ?? "N/A"}</p>
              <p><strong>Gender:</strong> {member.gender_label || member.gender || "N/A"}</p>
              <p><strong>Occupation:</strong> {member.occupation || "N/A"}</p>
              <p><strong>Education:</strong> {member.education || "N/A"}</p>
              <p><strong>Marital Status:</strong> {member.marital_status_label || member.marital_status || "N/A"}</p>
              {/* <p><strong>Created At:</strong> {formatDateTime(member.created_at)}</p> */}
              {/* <p><strong>Updated At:</strong> {formatDateTime(member.updated_at)}</p> */}
            </div>

            <div className="member-counts">
              <span>Details: {counts.details ?? 0}</span>
              <span>News: {counts.news ?? 0}</span>
              <span>Listings: {counts.listings ?? 0}</span>
            </div>

            <div className="member-latest-grid">
              <article>
                <h3>Latest Detail</h3>
                <p>{memberData.latest_detail?.title || "No detail available."}</p>
              </article>
              <article>
                <h3>Latest News</h3>
                <p>{memberData.latest_news?.title || "No news available."}</p>
              </article>
              <article>
                <h3>Latest Listing</h3>
                <p>{memberData.latest_listing?.title || "No listing available."}</p>
              </article>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MemberDetails;
