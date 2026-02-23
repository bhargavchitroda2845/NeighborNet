import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

function Profile() {
    const { member, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    console.log('Profile component - member:', member, 'isLoading:', isLoading);

    // Redirect if not logged in
    useEffect(() => {
        if (!isLoading && !member) {
            console.log('Not authenticated, redirecting to login');
            navigate('/member-login');
        }
    }, [member, isLoading, navigate]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logout();
        navigate('/');
    };

    if (isLoading) {
        return <div className="profile-loading">Loading profile...</div>;
    }

    if (!member) {
        return <div className="profile-loading">No member data. Redirecting...</div>;
    }

    // The member data comes from login response or profile API
    // Both structures have: {member, counts, latest_detail, ...}
    // member.member contains the actual member info
    const memberData = member?.member || member;

    if (!memberData || typeof memberData !== 'object') {
        console.error('Profile component error: Invalid member data', memberData);
        return <div className="profile-loading">Error: Unable to load profile data. Please login again.</div>;
    }

    const profileImageUrl = memberData.profile_image_url;

    console.log('memberData:', memberData);

    return (
        <div className="profile-container">
            <div className="profile-content">
                <div className="profile-header">
                    <h1>Member Profile</h1>
                </div>

                <div className="profile-card">
                    {/* Profile Picture Section */}
                    <div className="profile-picture-section">
                        <div className="profile-picture-container">
                            {profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt="Profile"
                                    className="profile-picture"
                                />
                            ) : (
                                <div className="profile-picture-placeholder">
                                    {memberData.first_name ? memberData.first_name.charAt(0).toUpperCase() : '?'}
                                    {memberData.surname ? memberData.surname.charAt(0).toUpperCase() : ''}
                                </div>
                            )}
                        </div>
                        <div className="profile-name-section">
                            <h2>{memberData.full_name || `${memberData.first_name} ${memberData.surname}`}</h2>
                            <p className="profile-username">@{memberData.username}</p>
                            <span className={`status-badge ${memberData.approval_status?.toLowerCase()}`}>
                                {memberData.approval_status}
                            </span>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2>Personal Information</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Member Number</label>
                                <p>{memberData.member_no || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Username</label>
                                <p>{memberData.username || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>First Name</label>
                                <p>{memberData.first_name || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Middle Name</label>
                                <p>{memberData.middle_name || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Surname</label>
                                <p>{memberData.surname || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Email</label>
                                <p>{memberData.email_id || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Phone</label>
                                <p>{memberData.phone_no || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Gender</label>
                                <p>{memberData.gender_label || memberData.gender || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Date of Birth</label>
                                <p>{memberData.date_of_birth || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Age</label>
                                <p>{memberData.age || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Occupation</label>
                                <p>{memberData.occupation || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Marital Status</label>
                                <p>{memberData.marital_status_label || memberData.marital_status || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Education</label>
                                <p>{memberData.education || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2>Address Information</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Country</label>
                                <p>{memberData.country?.name || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>State</label>
                                <p>{memberData.state?.name || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>City</label>
                                <p>{memberData.city?.name || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Address</label>
                                <p>{memberData.residential_address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2>Account Status</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Status</label>
                                <p>{memberData.status || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Approval Status</label>
                                <p>{memberData.approval_status || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Approved At</label>
                                <p>{memberData.approved_at ? new Date(memberData.approved_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label>Member Since</label>
                                <p>{memberData.created_at ? new Date(memberData.created_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {member.counts && (
                        <div className="profile-section">
                            <h2>Activity Statistics</h2>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-number">{member.counts.details || 0}</div>
                                    <div className="stat-label">Details</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{member.counts.news || 0}</div>
                                    <div className="stat-label">News Posts</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-number">{member.counts.listings || 0}</div>
                                    <div className="stat-label">Listings</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="profile-actions">
                        <button
                            className="logout-button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
