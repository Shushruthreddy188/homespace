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
  const { login, isAuthenticated, authError } = useAuth();

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
