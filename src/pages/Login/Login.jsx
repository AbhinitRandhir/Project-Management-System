
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiAlertCircle,
  FiLoader,
  FiBookOpen,
  FiCheckCircle,
  FiArrowRight,
} from "react-icons/fi";

import { getAdmins } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/Toast/Toast";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const { login, currentUser } = useAuth();

  const { success, error: showError } = useToast();

  // Form Data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // Email Validation
  const validateEmail = (value) => {
    const email = value.trim();

    if (!email) {
      return "";
    }

    const emailPattern =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailPattern.test(email)) {
      return "Enter a valid email address.";
    }

    return "Valid email";
  };

  // Password Validation
  const validatePassword = (value) => {
    if (!value) {
      return "";
    }

    if (value.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "Valid password";
  };

  // Live Validation
  const emailMessage = touched.email
    ? validateEmail(formData.email)
    : "";

  const passwordMessage = touched.password
    ? validatePassword(formData.password)
    : "";

  // Redirect Existing Session
  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard", {
        replace: true,
      });
    }
  }, [currentUser, navigate]);

  // Handle Input Change
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  // Handle Input Blur
  const handleBlur = (event) => {
    const { name } = event.target;

    setTouched((previousTouched) => ({
      ...previousTouched,
      [name]: true,
    }));
  };

  // Form Validation
  const validateForm = () => {
    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      return "Please enter your email and password.";
    }

    const emailError = validateEmail(email);

    if (emailError !== "Valid email") {
      return emailError;
    }

    const passwordError = validatePassword(password);

    if (passwordError !== "Valid password") {
      return passwordError;
    }

    return "";
  };

  // Handle Login
  const handleSubmit = async (event) => {
    event.preventDefault();

    setTouched({
      email: true,
      password: true,
    });

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      showError(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Fetch Admin Accounts
      const response = await getAdmins();

      const admins = Array.isArray(response?.data)
        ? response.data
        : [];

      // Find Matching User
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      const user = admins.find(
        (admin) =>
          admin.email?.trim().toLowerCase() === email &&
          admin.password === password
      );

      // Invalid Credentials
      if (!user) {
        const errorMessage = "Invalid email or password.";

        setError(errorMessage);
        showError(errorMessage);
        return;
      }

      // Account Status
      if (user.status !== "active") {
        const errorMessage =
          "Your account is currently inactive.";

        setError(errorMessage);
        showError(errorMessage);
        return;
      }

      // Login Success
      login(user);

      success("Login successful. Welcome back!");

      navigate("/dashboard", {
        replace: true,
      });
    } catch (loginError) {
      console.error("Login error:", loginError);

      const errorMessage =
        "Unable to connect to the server. Please check JSON Server.";

      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">

        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <FiBookOpen />
          </div>

          <h2 className="login-brand-name">
            ProjectTrack
          </h2>

          <p className="login-brand-description">
            Team-Based Project Management System
          </p>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>Welcome Back!</h1>

          <p>
            Sign in to access your dashboard.
          </p>
        </div>

        {/* General Error */}
        {error && (
          <div
            className="login-error"
            role="alert"
          >
            <FiAlertCircle />

            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
          noValidate
        >

          {/* Email */}
          <div className="login-form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <div
              className={`login-input-wrapper ${
                emailMessage === "Valid email"
                  ? "input-valid"
                  : emailMessage
                    ? "input-error"
                    : ""
              }`}
            >
              <FiMail className="login-input-icon" />

              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
                maxLength={150}
                disabled={isLoading}
              />
            </div>

            {emailMessage && (
              <div
                className={`login-field-message ${
                  emailMessage === "Valid email"
                    ? "valid"
                    : "error"
                }`}
              >
                {emailMessage === "Valid email" ? (
                  <FiCheckCircle />
                ) : (
                  <FiAlertCircle />
                )}

                <span>{emailMessage}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="login-form-group">
            <label htmlFor="password">
              Password
            </label>

            <div
              className={`login-input-wrapper ${
                passwordMessage === "Valid password"
                  ? "input-valid"
                  : passwordMessage
                    ? "input-error"
                    : ""
              }`}
            >
              <FiLock className="login-input-icon" />

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="current-password"
                maxLength={128}
                disabled={isLoading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                title={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={isLoading}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {passwordMessage && (
              <div
                className={`login-field-message ${
                  passwordMessage === "Valid password"
                    ? "valid"
                    : "error"
                }`}
              >
                {passwordMessage === "Valid password" ? (
                  <FiCheckCircle />
                ) : (
                  <FiAlertCircle />
                )}

                <span>{passwordMessage}</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FiLoader className="login-spinner" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        {/* Security Information */}
        <div className="login-security">
          <FiShield />

          <span>
            Secure access to your account
          </span>
        </div>

        {/* Footer */}
        <footer className="login-footer">
          Authorized access for Admin and Mentor only.
        </footer>

      </section>
    </main>
  );
}

export default Login;