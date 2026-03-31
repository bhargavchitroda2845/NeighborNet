import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/api';
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

    const handleEditProfile = () => {
        window.location.href = `${BASE_URL}/member/edit/`;
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
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1 className="profile-title">Member Profile</h1>
                    <p className="profile-subtitle">Personal information and account settings</p>
                </div>

                <div className="profile-main-card">
                    {/* Top Identity Section */}
                    <div className="profile-identity-section">
                        <div className="profile-avatar-wrapper">
                            {profileImageUrl ? (
                                <img
                                    src={profileImageUrl}
                                    alt="Profile"
                                    className="profile-avatar"
                                />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {memberData.first_name ? memberData.first_name.charAt(0).toUpperCase() : '?'}
                                    {memberData.surname ? memberData.surname.charAt(0).toUpperCase() : ''}
                                </div>
                            )}
                            <div className={`status-badge-floating ${memberData.approval_status?.toLowerCase()}`}>
                                <i className={`fas ${memberData.approval_status?.toLowerCase() === 'approved' ? 'fa-check-circle' : 'fa-clock'}`}></i>
                                {memberData.approval_status}
                            </div>
                        </div>
                        <div className="profile-name-info">
                            <h2 className="profile-full-name">{memberData.full_name || `${memberData.first_name} ${memberData.surname}`}</h2>
                            <p className="profile-at-username"><i className="fas fa-at"></i> {memberData.username}</p>
                            <div className="profile-quick-stats">
                                <span className="quick-stat"><i className="fas fa-id-badge"></i> NO: {memberData.member_no || '---'}</span>
                                <span className="quick-stat"><i className="fas fa-calendar-alt"></i> Joined {memberData.created_at ? new Date(memberData.created_at).toLocaleDateString() : '---'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-grid">
                        {/* Personal info card */}
                        <div className="info-glass-card">
                            <div className="card-header">
                                <i className="fas fa-user-circle"></i>
                                <h3>Personal Information</h3>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="info-label">Full Name</span>
                                    <span className="info-value">{memberData.first_name} {memberData.middle_name} {memberData.surname}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email</span>
                                    <span className="info-value">{memberData.email_id || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Phone</span>
                                    <span className="info-value">{memberData.phone_no || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Gender</span>
                                    <span className="info-value">{memberData.gender_label || memberData.gender || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Date of Birth</span>
                                    <span className="info-value">{memberData.date_of_birth || '---'} ({memberData.age || '0'} years)</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Marital Status</span>
                                    <span className="info-value">{memberData.marital_status_label || memberData.marital_status || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Occupation</span>
                                    <span className="info-value">{memberData.occupation || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Education</span>
                                    <span className="info-value">{memberData.education || '---'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Address info card */}
                        <div className="info-glass-card">
                            <div className="card-header">
                                <i className="fas fa-map-marked-alt"></i>
                                <h3>Address Details</h3>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <span className="info-label">Country</span>
                                    <span className="info-value">{memberData.country?.name || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">State</span>
                                    <span className="info-value">{memberData.state?.name || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">City</span>
                                    <span className="info-value">{memberData.city?.name || '---'}</span>
                                </div>
                                <div className="info-row address-row">
                                    <span className="info-label">Residential Address</span>
                                    <p className="info-value address-text">{memberData.residential_address || '---'}</p>
                                </div>

                                <div className="account-status-divider">
                                    <i className="fas fa-shield-alt"></i>
                                    <h3>Account Status</h3>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Account Type</span>
                                    <span className="info-value">{memberData.status || 'Standard Private'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Approval</span>
                                    <span className="info-value">{memberData.approval_status || '---'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Member Since</span>
                                    <span className="info-value">{memberData.created_at ? new Date(memberData.created_at).toLocaleDateString() : '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    {member.counts && (
                        <div className="profile-stats-bar">
                            <div className="profile-stat-box">
                                <span className="stat-count">{member.counts.details || 0}</span>
                                <span className="stat-label">Member Details</span>
                            </div>
                            <div className="profile-stat-box">
                                <span className="stat-count">{member.counts.news || 0}</span>
                                <span className="stat-label">News Posts</span>
                            </div>
                            <div className="profile-stat-box">
                                <span className="stat-count">{member.counts.listings || 0}</span>
                                <span className="stat-label">Marketplace List</span>
                            </div>
                        </div>
                    )}

                    {/* Final Actions */}
                    <div className="profile-footer-actions">
                        <button
                            className="btn-edit-profile"
                            onClick={handleEditProfile}
                            disabled={isLoggingOut}
                        >
                            <i className="fas fa-edit"></i> Edit Profile
                        </button>
                        <button
                            className="btn-logout-profile"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? (
                                <><i className="fas fa-spinner fa-spin"></i> Logging out...</>
                            ) : (
                                <><i className="fas fa-sign-out-alt"></i> Logout System</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
