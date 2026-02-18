import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const [profiles, setProfiles] = useState([]);
  const [gender, setGender] = useState("all");
  const [maritalStatus, setMaritalStatus] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/matrimonialData.json")
      .then((res) => res.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch((err) => console.error("Error loading matrimonial data", err));
  }, []);

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

  return (
    <div className="matrimonial-page">
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
        {filteredProfiles.length === 0 ? (
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
              <img src={profile.image_url} alt={profile.name} />
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
