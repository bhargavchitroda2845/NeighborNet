import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { CAREER_POST_DETAIL_API_URL } from "../config/api";
import "./CareerDetails.css";

function CareerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(CAREER_POST_DETAIL_API_URL(id), {
          signal: controller.signal,
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Failed to load career details");
        }
        setPost(data.result || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load career details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <div className="career-details-page"><p className="career-details-status">Loading career details...</p></div>;
  }

  if (error || !post) {
    return <div className="career-details-page"><p className="career-details-status error">{error || "Career post not found"}</p></div>;
  }

  const docLabel = post.post_type === "recruiter" ? "JD" : "Resume";
  const skillList = String(post.skills || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="career-details-page">
      <button type="button" className="career-details-back" onClick={() => navigate("/career")}>Back</button>

      <div className="career-details-card">
        <div className="career-details-header">
          {post.image_url ? (
            <img src={post.image_url} alt={post.full_name} className="career-details-avatar" />
          ) : (
            <div className="career-details-avatar placeholder">N</div>
          )}
          <div>
            <h1>{post.title}</h1>
            <p className="career-details-type">{post.post_type_label}</p>
            <p className="career-details-name">{post.full_name || "Unknown"}</p>
          </div>
        </div>

        <div className="career-details-contact-actions">
          {post.email && (
            <a className="career-details-btn ghost" href={`mailto:${post.email}`}>Email</a>
          )}
          {post.phone && (
            <a className="career-details-btn ghost" href={`tel:${post.phone}`}>Call</a>
          )}
        </div>

        <div className="career-details-grid">
          {post.location && (
            <div className="career-info-item"><strong>Location</strong><span>{post.location}</span></div>
          )}
          {(post.current_company_name || post.company_name) && (
            <div className="career-info-item"><strong>Current Company</strong><span>{post.current_company_name || post.company_name}</span></div>
          )}
          {post.email && (
            <div className="career-info-item"><strong>Email</strong><span>{post.email}</span></div>
          )}
          {post.phone && (
            <div className="career-info-item"><strong>Phone</strong><span>{post.phone}</span></div>
          )}
          {post.experience_years && (
            <div className="career-info-item"><strong>Experience</strong><span>{post.experience_years}</span></div>
          )}
          {post.current_ctc_lpa && (
            <div className="career-info-item"><strong>Current CTC</strong><span>{post.current_ctc_lpa} (LPA)</span></div>
          )}
          {post.expected_lpa && (
            <div className="career-info-item"><strong>Expected CTC</strong><span>{post.expected_lpa} (LPA)</span></div>
          )}
          {post.package_lpa && (
            <div className="career-info-item"><strong>Package</strong><span>{post.package_lpa} (LPA)</span></div>
          )}
          {post.contact_person_name && (
            <div className="career-info-item"><strong>Contact Person</strong><span>{post.contact_person_name}</span></div>
          )}
          {post.contact_person_number && (
            <div className="career-info-item"><strong>Contact Number</strong><span>{post.contact_person_number}</span></div>
          )}
          {skillList.length > 0 && (
            <div className="span-2 career-info-item">
              <strong>Skills</strong>
              <div className="career-skill-chip-wrap">
                {skillList.map((skill) => (
                  <span key={skill} className="career-skill-chip">{skill}</span>
                ))}
              </div>
            </div>
          )}
          {post.responsibilities && <div className="span-2 career-info-item"><strong>Responsibilities</strong><span>{post.responsibilities}</span></div>}
          {post.description && <div className="span-2 career-info-item"><strong>Description</strong><span>{post.description}</span></div>}
        </div>

        {post.document_url && (
          <div className="career-details-doc-section">
            <div className="career-details-doc-actions">
              <button
                type="button"
                className="career-details-btn"
                onClick={() => setShowResume((prev) => !prev)}
              >
                {showResume ? `Hide ${docLabel}` : `View ${docLabel}`}
              </button>
              <a href={post.document_download_url || post.document_url} className="career-details-btn secondary">
                Download {docLabel}
              </a>
            </div>

            {showResume && (
              <iframe
                src={post.document_url}
                title="Career Document Viewer"
                className="career-details-pdf-viewer"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CareerDetails;
