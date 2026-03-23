import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL } from "../config/api";
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
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/member/api/matrimonial/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Profile not found");
        return res.json();
      })
      .then((data) => {
        const p = data.result;
        // Normalize API fields to component display fields
        setProfile({
          id: p.id,
          name: p.full_name,
          age: p.age,
          date_of_birth: p.date_of_birth,
          gender: p.gender_label || p.gender,
          height: p.height || "Not specified",
          marital_status: p.marital_status_label || p.marital_status,
          profession: p.occupation || "Not specified",
          education: p.education || "Not specified",
          location: [p.city, p.state, p.country].filter(Boolean).join(", ") || "Not specified",
          annual_income: p.annual_income || "Not specified",
          blood_group: p.blood_group || "Not specified",
          gotra: p.gotra || "Not specified",
          manglik: p.manglik_label || "Not specified",
          relation: p.relation_label || "Not specified",
          bio: p.about_matrimonial || "",
          full_bio: p.full_bio || "",
          hobbies: p.hobbies || "Not specified",
          partner_preference: p.partner_preference || "Not specified",
          image_url: p.matrimonial_photo_url || p.profile_image_url || "",
          // New extended fields
          diet: p.diet_label || p.diet || "Not specified",
          addictions: p.addictions_label || p.addictions || "Not specified",
          father_name: p.father_name || "Not specified",
          mother_name: p.mother_name || "Not specified",
          family_type: p.family_type_label || p.family_type || "Not specified",
          siblings: p.siblings || "Not specified",
          contact_phone: p.contact_phone || "Not specified",
        });
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading matrimonial profile", err);
        setError("Profile not found or is no longer available.");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [id]);


  if (loading) {
    return <h2 style={{ padding: "24px" }}>Loading...</h2>;
  }

  if (error || !profile) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2 style={{ color: "#c2185b", marginBottom: "16px" }}>Profile Not Found</h2>
        <p style={{ color: "#666", marginBottom: "24px" }}>{error || "This profile may have been made private or removed."}</p>
        <button
          type="button"
          onClick={() => navigate("/matrimonial")}
          style={{ padding: "10px 24px", background: "#e91e8c", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" }}
        >
          ← Back to Profiles
        </button>
      </div>
    );
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
                <p><strong>Blood Group:</strong> {profile.blood_group}</p>
                <p><strong>Gotra:</strong> {profile.gotra}</p>
                <p><strong>Manglik:</strong> {profile.manglik}</p>
                <p><strong>Diet:</strong> {profile.diet}</p>
                <p><strong>Addictions:</strong> {profile.addictions}</p>
                <p><strong>Relation to Poster:</strong> {profile.relation}</p>
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
                <p><strong>Siblings:</strong> {profile.siblings || "Not specified"}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>Contact Details</h3>
              <div className="detail-grid">
                <p><strong>Parent Contact Number:</strong> {profile.contact_phone}</p>
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
