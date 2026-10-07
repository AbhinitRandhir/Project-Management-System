import { useEffect, useState } from "react";

import {
  FiAlertCircle,
  FiCalendar,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiUser,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

import "./Profile.css";

function Profile() {
  /* ===============================
     AUTH
  =============================== */

  const { currentUser } = useAuth();

  /* ===============================
     STATES
  =============================== */

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  /* ===============================
     FETCH CURRENT ADMIN PROFILE
  =============================== */

  const fetchProfile = async () => {
    if (!currentUser?.id) {
      setProfile(null);

      setError("Current user information is not available.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
        Current logged-in user only

        Example:
        GET /admins/2
      */

      const response = await api.get(`/admins/${currentUser.id}`);

      setProfile(response.data);
    } catch (err) {
      console.error("Failed to load profile:", err);

      setProfile(null);

      setError(
        err.response?.data?.message ||
          "Unable to load profile information. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     LOAD PROFILE
  =============================== */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [currentUser?.id]);

  /* ===============================
     DATE FORMAT
  =============================== */

  const formatDate = (date) => {
    if (!date) {
      return "Not Available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not Available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  /* ===============================
     AVATAR INITIAL
  =============================== */

  const getInitial = () => {
    if (!profile?.name) {
      return "A";
    }

    return profile.name.trim().charAt(0).toUpperCase();
  };

  /* ===============================
     LOADING
  =============================== */

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loader" />

          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }

  /* ===============================
     ERROR
  =============================== */

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <div className="profile-error-icon">
            <FiAlertCircle />
          </div>

          <h2>Unable to Load Profile</h2>

          <p>{error}</p>

          {currentUser?.id && (
            <button type="button" onClick={fetchProfile}>
              <FiRefreshCw />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ===============================
     NO PROFILE
  =============================== */

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <div className="profile-error-icon">
            <FiUser />
          </div>

          <h2>Profile Not Found</h2>

          <p>Your profile information is not available.</p>

          <button type="button" onClick={fetchProfile}>
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* ================= PAGE HEADER ================= */}

      <div className="profile-page-header">
        <div>
          <span className="profile-page-label">Account Settings</span>

          <h1>My Profile</h1>

          <p>View your account and profile information.</p>
        </div>

        <button
          type="button"
          className="profile-refresh-btn"
          onClick={fetchProfile}
          title="Refresh Profile"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {/* ================= MAIN PROFILE CARD ================= */}

      <div className="profile-main-card">
        {/* COVER */}

        <div className="profile-cover" />

        {/* USER */}

        <div className="profile-user-section">
          <div className="profile-avatar">
            {profile.image ? (
              <img src={profile.image} alt={profile.name || "Admin"} />
            ) : (
              <span>{getInitial()}</span>
            )}
          </div>

          <div className="profile-user-info">
            <h2>{profile.name || "Not Available"}</h2>

            <div className="profile-role">
              <FiShield />

              <span>{profile.role || "Admin"}</span>
            </div>
          </div>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="profile-content">
          {/* PERSONAL INFORMATION */}

          <div className="profile-section">
            <div className="profile-section-header">
              <FiUser />

              <div>
                <h3>Personal Information</h3>

                <p>Your basic account details</p>
              </div>
            </div>

            <div className="profile-info-grid">
              {/* NAME */}

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <FiUser />
                </div>

                <div>
                  <span>Full Name</span>

                  <strong>{profile.name || "-"}</strong>
                </div>
              </div>

              {/* EMAIL */}

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <FiMail />
                </div>

                <div>
                  <span>Email Address</span>

                  <strong>{profile.email || "-"}</strong>
                </div>
              </div>

              {/* PHONE */}

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <FiPhone />
                </div>

                <div>
                  <span>Phone Number</span>

                  <strong>{profile.phone || "-"}</strong>
                </div>
              </div>

              {/* ROLE */}

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <FiShield />
                </div>

                <div>
                  <span>Account Role</span>

                  <strong>{profile.role || "-"}</strong>
                </div>
              </div>
              {/* COURSE - DEPARTMENT */}

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <FiUser />
                </div>

                <div>
                  <span>Course - Department</span>

                  <strong>
                    {profile.course || "B.Tech"} - {profile.department || "-"}
                  </strong>
                </div>
              </div>

              {/* ACCOUNT CREATED */}

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <FiCalendar />
                </div>

                <div>
                  <span>Account Created</span>

                  <strong>{formatDate(profile.createdAt)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ================= ACCOUNT SECURITY ================= */}

          <div className="profile-section">
            <div className="profile-section-header">
              <FiLock />

              <div>
                <h3>Account Security</h3>

                <p>Your password information</p>
              </div>
            </div>

            <div className="profile-security-card">
              <div className="profile-security-left">
                <div className="profile-info-icon">
                  <FiLock />
                </div>

                <div>
                  <span>Password</span>

                  <strong className="profile-password">
                    {showPassword ? profile.password || "-" : "••••••••••••"}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                className="profile-password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? (
                  <>
                    <FiEyeOff />
                    Hide
                  </>
                ) : (
                  <>
                    <FiEye />
                    Show
                  </>
                )}
              </button>
            </div>

            <div className="profile-security-note">
              <FiAlertCircle />

              <p>
                Keep your password private and do not share your account
                credentials with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
