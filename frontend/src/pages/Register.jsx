import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "../Components/PageNav";
import styles from "./Register.module.css";

export default function Signup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    password: "",
    isAgent: false,
  });
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:4000";

  // Validation functions
  function validateEmail(email) {
    if (!email.trim()) {
      return "Email address is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  }

  function validatePhone(phone) {
    if (!phone.trim()) {
      return "Phone number is required";
    }
    const phoneRegex = /^[0-9]{10}$/; // simple US 10-digit example
    if (!phoneRegex.test(phone)) {
      return "Please enter a valid phone number";
    }
    return null;
  }

  function validateName(name, fieldName) {
    if (!name.trim()) {
      return `${fieldName} is required`;
    }
    if (name.length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    return null;
  }

  function validatePassword(password) {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
    return null;
  }

  // Handle input changes
  function handleInputChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation after first submit attempt
    if (hasSubmitted) {
      let error = null;
      switch (field) {
        case "email":
          error = validateEmail(value);
          break;
        case "phone":
          error = validatePhone(value);
          break;
        case "firstName":
          error = validateName(value, "First name");
          break;
        case "lastName":
          error = validateName(value, "Last name");
          break;
        case "password":
          error = validatePassword(value);
          break;
        default:
          break;
      }
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  }

  // Handle Step 1 (Email) submission
  function handleStep1Submit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone);
    setErrors({ email: emailError, phone: phoneError });

    if (!emailError && !phoneError) {
      setCurrentStep(2);
      setHasSubmitted(false); // Reset for step 2
    }
  }

  // Handle Step 2 (Complete Registration) submission
  async function handleStep2Submit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const firstNameError = validateName(formData.firstName, "First name");
    const lastNameError = validateName(formData.lastName, "Last name");
    const passwordError = validatePassword(formData.password);
    const phoneError = validatePhone(formData.phone);

    async function userExists(email) {
      const res = await fetch(
        `${BASE_URL}/users?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) throw new Error("Failed to check user");
      const data = await res.json();
      return data.length > 0;
    }

    async function createUser(payload) {
      const res = await fetch(`${BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create user");
      }
      return res.json();
    }

    setErrors({
      firstName: firstNameError,
      lastName: lastNameError,
      password: passwordError,
      ...(phoneError ? { phone: phoneError } : {}),
    });

    if (firstNameError || lastNameError || passwordError || phoneError) return;
    try {
      // 1) uniqueness check
      if (await userExists(formData.email)) {
        setErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists",
        }));
        return;
      }

      // 2) build user payload
      const user = {
        id: Date.now(), // json-server will also auto-ID if omitted
        email: formData.email,
        phone: formData.phone, // <- from step 1
        firstName: formData.firstName,
        lastName: formData.lastName,
        // ⚠️ For demos only—don't store plaintext in production
        password: formData.password,
        role: formData.isAgent ? "agent" : "user",
        favorites: {
          buy: [],
          rent: [],
        },
        listings: {
          buy: [],
          rent: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // 3) save
      await createUser(user);

      // 4) go to login (or straight to app if you prefer)
      navigate("/login", {
        state: { message: "Account created successfully!" },
      });
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({
        ...prev,
        submit: "There was an error creating your account. Please try again.",
      }));
    }
  }

  function goBackToStep1() {
    setCurrentStep(1);
    setErrors({});
    setHasSubmitted(false);
  }

  function goToLogin() {
    navigate("/login");
  }

  return (
    <main className={styles.signup}>
      <PageNav />

      <div className={styles.formContainer}>
        {currentStep === 1 ? (
          // Step 1: Email Collection
          <form className={styles.form} onSubmit={handleStep1Submit}>
            <h2>Create Account</h2>
            <p className={styles.subtitle}>
              Lets get started with your email address
            </p>

            <div className={styles.row}>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email address"
                className={errors.email ? styles.inputError : ""}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <div className={styles.errorMessage}>{errors.email}</div>
              )}
            </div>

            <div className={styles.row}>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter your phone number"
                className={errors.phone ? styles.inputError : ""}
                aria-invalid={errors.phone ? "true" : "false"}
              />
              {errors.phone && (
                <div className={styles.errorMessage}>{errors.phone}</div>
              )}
            </div>

            <button type="submit" className={styles.continueButton}>
              Continue
            </button>

            <div className={styles.loginLink}>
              Already have an account?
              <button
                type="button"
                onClick={goToLogin}
                className={styles.linkButton}
              >
                Sign in
              </button>
            </div>
          </form>
        ) : (
          // Step 2: Complete Registration
          <form className={styles.form} onSubmit={handleStep2Submit}>
            <div className={styles.stepHeader}>
              <button
                type="button"
                onClick={goBackToStep1}
                className={styles.backButton}
              >
                ← Back
              </button>
              <div className={styles.emailDisplay}>
                {formData.email} | {formData.phone}
              </div>
            </div>

            <h2>Complete Your Registration</h2>

            <div className={styles.nameRow}>
              <div className={styles.nameField}>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="First name"
                  className={errors.firstName ? styles.inputError : ""}
                  aria-invalid={errors.firstName ? "true" : "false"}
                />
                {errors.firstName && (
                  <div className={styles.errorMessage}>{errors.firstName}</div>
                )}
              </div>

              <div className={styles.nameField}>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Last name"
                  className={errors.lastName ? styles.inputError : ""}
                  aria-invalid={errors.lastName ? "true" : "false"}
                />
                {errors.lastName && (
                  <div className={styles.errorMessage}>{errors.lastName}</div>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Create a password"
                className={errors.password ? styles.inputError : ""}
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <div className={styles.errorMessage}>{errors.password}</div>
              )}
              <div className={styles.passwordHint}>
                Password must be at least 8 characters with uppercase,
                lowercase, and number
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="isAgent"
                checked={formData.isAgent}
                onChange={(e) => handleInputChange("isAgent", e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="isAgent" className={styles.checkboxLabel}>
                Are you an Agent? <strong>Register Here</strong>
              </label>
            </div>

            <button type="submit" className={styles.registerButton}>
              Create Account
            </button>
            {errors.submit && (
              <div className={styles.errorMessage}>{errors.submit}</div>
            )}

            <div className={styles.loginLink}>
              Already have an account?
              <button
                type="button"
                onClick={goToLogin}
                className={styles.linkButton}
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
