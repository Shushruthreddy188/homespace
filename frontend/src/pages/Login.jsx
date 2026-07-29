import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageNav from "../Components/PageNav";
import styles from "./Login.module.css";
import { useAuth } from "../contexts/FakeAuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAuthenticated, authError } = useAuth();

  // Validation functions
  function validateEmailOrPhone(value) {
    if (!value.trim()) {
      return "Email or phone number is required";
    }

    // Check if it's a phone number (simple validation)
    // eslint-disable-next-line no-useless-escape
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(value) &&
      // eslint-disable-next-line no-useless-escape
      !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))
    ) {
      return "Please enter a valid email or phone number";
    }

    return null;
  }

  function validatePassword(value) {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return null;
  }

  // Handle input changes with real-time validation
  function handleEmailChange(e) {
    const value = e.target.value;
    setEmail(value);

    if (touched.email) {
      const error = validateEmailOrPhone(value);
      setErrors((prev) => ({ ...prev, email: error }));
    }
  }

  function handlePasswordChange(e) {
    const value = e.target.value;
    setPassword(value);

    if (touched.password) {
      const error = validatePassword(value);
      setErrors((prev) => ({ ...prev, password: error }));
    }
  }

  // Handle blur events (when user leaves the field)
  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "email") {
      const error = validateEmailOrPhone(email);
      setErrors((prev) => ({ ...prev, email: error }));
    } else if (field === "password") {
      const error = validatePassword(password);
      setErrors((prev) => ({ ...prev, password: error }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const emailError = validateEmailOrPhone(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    await login(email, password); // now async and hits JSON server
  }

  useEffect(() => {
    if (isAuthenticated) navigate("/AppLayout", { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <main className={styles.login}>
      <PageNav />

      <div className={styles.formContainer}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2>Sign In</h2>

          <div className={styles.row}>
            <input
              type="text"
              id="email"
              onChange={handleEmailChange}
              onBlur={() => handleBlur("email")}
              value={email}
              placeholder="Email or phone number"
              className={errors.email ? styles.inputError : ""}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && (
              <div className={styles.errorMessage}>{errors.email}</div>
            )}
          </div>

          <div className={styles.row}>
            <input
              type="password"
              id="password"
              onChange={handlePasswordChange}
              onBlur={() => handleBlur("password")}
              value={password}
              placeholder="Password"
              className={errors.password ? styles.inputError : ""}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && (
              <div className={styles.errorMessage}>{errors.password}</div>
            )}
          </div>
          {authError && <div className={styles.errorMessage}>{authError}</div>}

          <button type="submit" className={styles.loginButton}>
            Sign In
          </button>

          <button
            type="button"
            className={styles.googleButton}
            onClick={loginWithGoogle}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 48 48"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.2-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.6 4.1 29.6 2 24 2 15.8 2 8.7 6.7 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 46c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C8.6 41.2 15.7 46 24 46z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C41.6 36.3 46 31 46 24c0-1.2-.1-2.3-.4-3.5z"
              />
            </svg>
            Continue with Google
          </button>

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <div className={styles.divider}>.</div>
          <button
            type="button"
            className={styles.createAccountButton}
            onClick={() => navigate("/register")}
          >
            Create New Account
          </button>
        </form>
      </div>
    </main>
  );
}
