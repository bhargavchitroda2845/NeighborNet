import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./MatrimonialDetails.css";

function formatMaritalStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  if (status === "never married" || status === "single") {
    return "Single";
  }
  return value || "Not specified";
}

function MatrimonialDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch("/data/matrimonialData.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unable to load profile");
        }
        return res.json();
      })
      .then((data) => {
        const selectedProfile = (data.profiles || []).find(
          (item) => String(item.id) === String(id)
        );
        setProfile(selectedProfile || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading matrimonial profile", err);
        setProfile(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <h2 style={{ padding: "24px" }}>Loading...</h2>;
  }

  if (!profile) {
    return <h2 style={{ padding: "24px" }}>Profile not found</h2>;
  }

  return (
    <div className="matrimonial-detail-page">
      <div className="matrimonial-detail-wrapper">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/matrimonial")}
        >
          Back to Profiles
        </button>

        <div className="matrimonial-detail-card">
          <img src={profile.image_url} alt={profile.name} />

          <div className="matrimonial-detail-content">
            <h1>{profile.name}</h1>
            <p className="profile-tagline">{profile.profession} | {profile.location}</p>

            <div className="detail-section">
              <h3>Personal Details</h3>
              <div className="detail-grid">
                <p><strong>Age:</strong> {profile.age} years</p>
                <p><strong>Date of Birth:</strong> {profile.date_of_birth || "Not specified"}</p>
                <p><strong>Gender:</strong> {profile.gender}</p>
                <p><strong>Height:</strong> {profile.height}</p>
                <p><strong>Marital Status:</strong> {formatMaritalStatus(profile.marital_status)}</p>
                <p><strong>Religion:</strong> {profile.religion || "Not specified"}</p>
                <p><strong>Community:</strong> {profile.community || "Not specified"}</p>
                <p><strong>Mother Tongue:</strong> {profile.mother_tongue || "Not specified"}</p>
                <p><strong>Diet:</strong> {profile.diet || "Not specified"}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>Professional Details</h3>
              <div className="detail-grid">
                <p><strong>Profession:</strong> {profile.profession}</p>
                <p><strong>Education:</strong> {profile.education || "Not specified"}</p>
                <p><strong>Location:</strong> {profile.location}</p>
                <p><strong>Annual Income:</strong> {profile.annual_income || "Not specified"}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>Family Details</h3>
              <div className="detail-grid">
                <p><strong>Father:</strong> {profile.father_name || "Not specified"}</p>
                <p><strong>Mother:</strong> {profile.mother_name || "Not specified"}</p>
                <p><strong>Family Type:</strong> {profile.family_type || "Not specified"}</p>
                <p><strong>Family Values:</strong> {profile.family_values || "Not specified"}</p>
                <p><strong>Siblings:</strong> {profile.siblings || "Not specified"}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>Contact Details</h3>
              <div className="detail-grid">
                <p><strong>Phone:</strong> {profile.phone || "Not specified"}</p>
                <p><strong>Email:</strong> {profile.email || "Not specified"}</p>
              </div>
            </div>

            <div className="bio-section">
              <h3>About Me</h3>
              <p>{profile.bio}</p>
            </div>

            <div className="bio-section">
              <h3>Full Biodata</h3>
              <p>{profile.full_bio || profile.bio}</p>
            </div>

            <div className="bio-section">
              <h3>Hobbies</h3>
              <p>{profile.hobbies || "Not specified"}</p>
            </div>

            <div className="bio-section">
              <h3>Partner Preference</h3>
              <p>{profile.partner_preference || "Not specified"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MatrimonialDetails;
