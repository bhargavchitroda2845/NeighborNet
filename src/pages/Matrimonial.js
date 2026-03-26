import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MATRIMONIAL_LIST_API_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import "./Matrimonial.css";

function normalizeMaritalStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  if (status === "never married" || status === "single") {
    return "single";
  }
  return status;
}

function formatMaritalStatus(value) {
  return normalizeMaritalStatus(value) === "single" ? "Single" : value;
}

function Matrimonial() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [gender, setGender] = useState("all");
  const [maritalStatus, setMaritalStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const apiUrl = `${MATRIMONIAL_LIST_API_URL}?logged_in=${isAuthenticated}`;
    fetch(apiUrl, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load matrimonial profiles");
        return res.json();
      })
      .then((data) => {
        // Normalize API fields to match card display
        const normalized = (data.results || []).map((p) => ({
          id: p.id,
          name: p.full_name,
          age: p.age,
          height: p.height || "N/A",
          gender: p.gender_label || p.gender,
          profession: p.occupation || "N/A",
          location: [p.city, p.state, p.country].filter(Boolean).join(", ") || "N/A",
          marital_status: p.marital_status_label || p.marital_status,
          bio: p.about_matrimonial || "",
          image_url: p.matrimonial_photo_url || p.profile_image_url || "",
          blood_group: p.blood_group,
          gotra: p.gotra,
          manglik: p.manglik_label,
          annual_income: p.annual_income,
          education: p.education,
          relation: p.relation_label,
        }));
        setProfiles(normalized);
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading matrimonial data", err);
        setError("Unable to load matrimonial profiles.");
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);


  useEffect(() => {
    if (!location.state?.refreshMatrimonial) {
      return;
    }

    setGender("all");
    setMaritalStatus("all");
    setQuery("");
  }, [location.key, location.state]);

  const filteredProfiles = useMemo(() => {
    const text = query.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchGender = gender === "all" || profile.gender === gender;
      const matchStatus =
        maritalStatus === "all" ||
        normalizeMaritalStatus(profile.marital_status) === normalizeMaritalStatus(maritalStatus);
      const matchQuery =
        !text ||
        profile.name.toLowerCase().includes(text) ||
        profile.profession.toLowerCase().includes(text) ||
        profile.location.toLowerCase().includes(text) ||
        profile.bio.toLowerCase().includes(text);

      return matchGender && matchStatus && matchQuery;
    });
  }, [profiles, gender, maritalStatus, query]);

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

  return (
    <div 
      className="matrimonial-page"
      onMouseMove={handlePointerMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      <div className="cursor-follow-glow" aria-hidden="true" />
      <div className="matrimonial-header">
        <h1>Matrimonial</h1>
        <p>Find suitable profiles from your community.</p>
      </div>

      <div className="matrimonial-filters">
        <input
          type="text"
          placeholder="Search by name, profession, location..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <select value={gender} onChange={(event) => setGender(event.target.value)}>
          <option value="all">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <select
          value={maritalStatus}
          onChange={(event) => setMaritalStatus(event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="Single">Single</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
      </div>

      <div className="matrimonial-grid">
        {loading ? (
          <p className="empty-text">Loading profiles...</p>
        ) : error ? (
          <p className="empty-text" style={{ color: "red" }}>{error}</p>
        ) : filteredProfiles.length === 0 ? (
          <p className="empty-text">No profiles found.</p>
        ) : (
          filteredProfiles.map((profile, index) => (
            <article
              key={profile.id}
              className="profile-card"
              style={{ "--index": index }}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/matrimonial/${profile.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/matrimonial/${profile.id}`);
                }
              }}
            >
              <img src={profile.image_url} alt={profile.name} loading="lazy" decoding="async" />
              <div className="profile-content">
                <h3>{profile.name}</h3>
                <p className="meta-line">
                  {profile.age} yrs | {profile.height} | {profile.gender}
                </p>
                <p className="meta-line">
                  {profile.profession} | {profile.location}
                </p>
                <p className="meta-line">Status: {formatMaritalStatus(profile.marital_status)}</p>
                <p className="bio">{profile.bio}</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/matrimonial/${profile.id}`);
                  }}
                >
                  View Details
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default Matrimonial;
