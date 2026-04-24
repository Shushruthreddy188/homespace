import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProperties } from "../contexts/PropertiesContext";
import styles from "./PropertyListing.module.css";
import { useAuth } from "../contexts/FakeAuthContext";

export default function ListProperty() {
  const { user } = useAuth();
  const sessionUser =
    user ?? JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = sessionUser?.id;
  const USER_API = "http://localhost:4000/users";
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    listingType: "", // "rent" or "sell"
    name: "",
    address: "",
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    maxBeds: "",
    description: "",
    image: "",
  });
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const navigate = useNavigate();
  const [listings, setListings] = useState({
    buy: new Set(),
    rent: new Set(),
  });

  // Get functions from Properties Context
  const {
    createProperty,
    isLoading,
    error: contextError,
    clearError,
  } = useProperties();

  // Validation functions
  function validateListingType(type) {
    if (!type) {
      return "Please select listing type";
    }
    return null;
  }

  function validatePropertyBasics(data) {
    const errors = {};

    if (!data.name.trim()) {
      errors.name = "Property name is required";
    }

    if (!data.address.trim()) {
      errors.address = "Address is required";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  function validatePriceAndBeds(data) {
    const errors = {};

    if (!data.minPrice || data.minPrice <= 0) {
      errors.minPrice = "Minimum price is required";
    }

    if (!data.maxPrice || data.maxPrice <= 0) {
      errors.maxPrice = "Maximum price is required";
    }

    if (
      data.minPrice &&
      data.maxPrice &&
      parseInt(data.minPrice) > parseInt(data.maxPrice)
    ) {
      errors.maxPrice = "Maximum price must be greater than minimum price";
    }

    if (!data.minBeds || data.minBeds <= 0) {
      errors.minBeds = "Minimum bedrooms is required";
    }

    if (!data.maxBeds || data.maxBeds <= 0) {
      errors.maxBeds = "Maximum bedrooms is required";
    }

    if (
      data.minBeds &&
      data.maxBeds &&
      parseInt(data.minBeds) > parseInt(data.maxBeds)
    ) {
      errors.maxBeds = "Maximum bedrooms must be greater than minimum bedrooms";
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  function validateDescription(description) {
    if (!description.trim()) {
      return "Description is required";
    }
    if (description.length < 50) {
      return "Description must be at least 50 characters";
    }
    return null;
  }

  // Handle input changes
  function handleInputChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation after first submit attempt
    if (hasSubmitted) {
      let error = null;
      if (field === "description") {
        error = validateDescription(value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    }
  }

  // Step navigation handlers
  function handleStep1Submit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const error = validateListingType(formData.listingType);
    setErrors({ listingType: error });

    if (!error) {
      setCurrentStep(2);
      setHasSubmitted(false);
    }
  }

  function handleStep2Submit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const validationErrors = validatePropertyBasics(formData);
    setErrors(validationErrors || {});

    if (!validationErrors) {
      setCurrentStep(3);
      setHasSubmitted(false);
    }
  }

  function handleStep3Submit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const validationErrors = validatePriceAndBeds(formData);
    setErrors(validationErrors || {});

    if (!validationErrors) {
      setCurrentStep(4);
      setHasSubmitted(false);
    }
  }

  function handleStep4Submit(e) {
    e.preventDefault();
    setHasSubmitted(true);

    const descriptionError = validateDescription(formData.description);
    setErrors({ description: descriptionError });

    if (!descriptionError) {
      // Clear any existing context errors
      if (contextError) clearError();

      // Handle successful property listing
      handlePropertyCreation();
    }
  }

  // Fix in PropertyListing.jsx - update the handlePropertyCreation function

  async function handlePropertyCreation() {
    try {
      // Convert string numbers to integers and map listingType
      const propertyData = {
        ...formData,
        listingType:
          formData.listingType === "sell" ? "buy" : formData.listingType, // Map to backend values
        minPrice: parseInt(formData.minPrice),
        maxPrice: parseInt(formData.maxPrice),
        minBeds: parseInt(formData.minBeds),
        maxBeds: parseInt(formData.maxBeds),
      };

      console.log("Creating property with data:", propertyData);
      const created = await createProperty(propertyData);
      const createdId = created?.id;

      if (!createdId) {
        throw new Error("Property was created but no ID was returned");
      }

      // Prepare the updated listings - use original frontend listingType
      const updatedListings = {
        buy: new Set(listings.buy),
        rent: new Set(listings.rent),
      };

      // Use original formData.listingType for frontend state management
      if (formData.listingType === "rent") {
        updatedListings.rent.add(createdId);
      } else if (formData.listingType === "sell") {
        updatedListings.buy.add(createdId);
      }

      // Try to update the user's listings on the server first
      try {
        await patchListings(updatedListings);
        // Only update local state if server update succeeds
        setListings(updatedListings);
      } catch (patchError) {
        setErrors({
          general:
            "Property created but failed to add to your listings. Please refresh and try again.",
        });
        return; // Don't navigate if listings update failed
      }

      navigate(
        `/AppLayout/${formData.listingType === "rent" ? "rent" : "buy"}`,
        { state: { message: "Property listed successfully!" } }
      );
    } catch (error) {
      console.error("Failed to create property:", error);
      setErrors({ general: "Failed to create property. Please try again." });
    }
  }

  async function patchListings(next) {
    if (!currentUserId) {
      throw new Error("No user ID available");
    }

    const body = {
      listings: {
        buy: Array.from(next.buy),
        rent: Array.from(next.rent),
      },
      updatedAt: new Date().toISOString(),
    };

    // eslint-disable-next-line no-useless-catch
    try {
      const res = await fetch(`${USER_API}/${currentUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Failed to update listings: ${res.status} - ${errorText}`
        );
      }

      const responseData = await res.json();
      return responseData;
    } catch (fetchError) {
      throw fetchError;
    }
  }

  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const res = await fetch(`${USER_API}/${currentUserId}`);
        if (!res.ok) throw new Error("Failed to load user");
        const u = await res.json();
        const buyIds = new Set(u?.listings?.buy ?? []);
        const rentIds = new Set(u?.listings?.rent ?? []);
        setListings({ buy: buyIds, rent: rentIds });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [USER_API, currentUserId]);

  function goToPrevStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setHasSubmitted(false);
    }
  }

  function goToHome() {
    navigate("/");
  }

  // Show error if user is not logged in
  if (!currentUserId) {
    return (
      <main className={styles.listProperty}>
        <div className={styles.formContainer}>
          <div className={styles.form}>
            <h2>Please log in to list a property</h2>
            <button onClick={goToHome} className={styles.continueButton}>
              Go to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.listProperty}>
      <div className={styles.formContainer}>
        <div className={styles.form}>
          {/* Progress indicator */}
          <div className={styles.progressBar}>
            <div className={styles.progressSteps}>
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`${styles.progressStep} ${
                    step <= currentStep ? styles.active : ""
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className={styles.progressLine}>
              <div
                className={styles.progressFill}
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {errors.general && (
            <div className={styles.errorMessage}>{errors.general}</div>
          )}

          {currentStep === 1 && (
            // Step 1: Listing Type
            <form onSubmit={handleStep1Submit}>
              <h2>What type of listing is this?</h2>
              <p className={styles.subtitle}>
                Choose how you want to list your property
              </p>

              <div className={styles.listingTypeContainer}>
                <label
                  className={`${styles.listingTypeOption} ${
                    formData.listingType === "rent" ? styles.selected : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="listingType"
                    value="rent"
                    checked={formData.listingType === "rent"}
                    onChange={(e) =>
                      handleInputChange("listingType", e.target.value)
                    }
                    className={styles.radioInput}
                  />
                  <div className={styles.optionContent}>
                    <div className={styles.optionIcon}>🏠</div>
                    <h3>For Rent</h3>
                    <p>List your property for rental</p>
                  </div>
                </label>

                <label
                  className={`${styles.listingTypeOption} ${
                    formData.listingType === "sell" ? styles.selected : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="listingType"
                    value="sell"
                    checked={formData.listingType === "sell"}
                    onChange={(e) =>
                      handleInputChange("listingType", e.target.value)
                    }
                    className={styles.radioInput}
                  />
                  <div className={styles.optionContent}>
                    <div className={styles.optionIcon}>💰</div>
                    <h3>For Sale</h3>
                    <p>List your property for sale</p>
                  </div>
                </label>
              </div>

              {errors.listingType && (
                <div className={styles.errorMessage}>{errors.listingType}</div>
              )}

              <button type="submit" className={styles.continueButton}>
                Continue
              </button>
            </form>
          )}

          {currentStep === 2 && (
            // Step 2: Property Basics
            <form onSubmit={handleStep2Submit}>
              <div className={styles.stepHeader}>
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className={styles.backButton}
                >
                  ← Back
                </button>
                <span className={styles.stepInfo}>Step 2 of 4</span>
              </div>

              <h2>Tell us about your property</h2>
              <p className={styles.subtitle}>
                Basic information about your{" "}
                {formData.listingType === "rent" ? "rental" : "property"}
              </p>

              <div className={styles.row}>
                <label htmlFor="name">Property Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., The Collective at Lubbock"
                  className={errors.name ? styles.inputError : ""}
                />
                {errors.name && (
                  <div className={styles.errorMessage}>{errors.name}</div>
                )}
              </div>

              <div className={styles.row}>
                <label htmlFor="address">Full Address</label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="e.g., 2001 9th St, Lubbock, TX 79401"
                  className={errors.address ? styles.inputError : ""}
                />
                {errors.address && (
                  <div className={styles.errorMessage}>{errors.address}</div>
                )}
              </div>

              <button type="submit" className={styles.continueButton}>
                Continue
              </button>
            </form>
          )}

          {currentStep === 3 && (
            // Step 3: Price and Bedrooms
            <form onSubmit={handleStep3Submit}>
              <div className={styles.stepHeader}>
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className={styles.backButton}
                >
                  ← Back
                </button>
                <span className={styles.stepInfo}>Step 3 of 4</span>
              </div>

              <h2>Pricing and Bedroom Details</h2>
              <p className={styles.subtitle}>
                Set your{" "}
                {formData.listingType === "rent"
                  ? "rental rates"
                  : "selling price"}{" "}
                and bedroom options
              </p>

              <div className={styles.priceRow}>
                <div className={styles.priceField}>
                  <label htmlFor="minPrice">
                    {formData.listingType === "rent"
                      ? "Min Rent ($)"
                      : "Min Price ($)"}
                  </label>
                  <input
                    type="number"
                    id="minPrice"
                    value={formData.minPrice}
                    onChange={(e) =>
                      handleInputChange("minPrice", e.target.value)
                    }
                    placeholder="499"
                    className={errors.minPrice ? styles.inputError : ""}
                  />
                  {errors.minPrice && (
                    <div className={styles.errorMessage}>{errors.minPrice}</div>
                  )}
                </div>

                <div className={styles.priceField}>
                  <label htmlFor="maxPrice">
                    {formData.listingType === "rent"
                      ? "Max Rent ($)"
                      : "Max Price ($)"}
                  </label>
                  <input
                    type="number"
                    id="maxPrice"
                    value={formData.maxPrice}
                    onChange={(e) =>
                      handleInputChange("maxPrice", e.target.value)
                    }
                    placeholder="905"
                    className={errors.maxPrice ? styles.inputError : ""}
                  />
                  {errors.maxPrice && (
                    <div className={styles.errorMessage}>{errors.maxPrice}</div>
                  )}
                </div>
              </div>

              <div className={styles.bedroomRow}>
                <div className={styles.bedroomField}>
                  <label htmlFor="minBeds">Min Bedrooms</label>
                  <input
                    type="number"
                    id="minBeds"
                    value={formData.minBeds}
                    onChange={(e) =>
                      handleInputChange("minBeds", e.target.value)
                    }
                    placeholder="2"
                    min="1"
                    className={errors.minBeds ? styles.inputError : ""}
                  />
                  {errors.minBeds && (
                    <div className={styles.errorMessage}>{errors.minBeds}</div>
                  )}
                </div>

                <div className={styles.bedroomField}>
                  <label htmlFor="maxBeds">Max Bedrooms</label>
                  <input
                    type="number"
                    id="maxBeds"
                    value={formData.maxBeds}
                    onChange={(e) =>
                      handleInputChange("maxBeds", e.target.value)
                    }
                    placeholder="5"
                    min="1"
                    className={errors.maxBeds ? styles.inputError : ""}
                  />
                  {errors.maxBeds && (
                    <div className={styles.errorMessage}>{errors.maxBeds}</div>
                  )}
                </div>
              </div>

              <button type="submit" className={styles.continueButton}>
                Continue
              </button>
            </form>
          )}

          {currentStep === 4 && (
            // Step 4: Description and Image
            <form onSubmit={handleStep4Submit}>
              <div className={styles.stepHeader}>
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className={styles.backButton}
                >
                  ← Back
                </button>
                <span className={styles.stepInfo}>Step 4 of 4</span>
              </div>

              <h2>Add Description and Photo</h2>
              <p className={styles.subtitle}>
                Help potential{" "}
                {formData.listingType === "rent" ? "tenants" : "buyers"} learn
                about your property
              </p>

              <div className={styles.row}>
                <label htmlFor="description">Property Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Welcome to your property - describe the features, amenities, and what makes it special..."
                  className={`${styles.textarea} ${
                    errors.description ? styles.inputError : ""
                  }`}
                  rows="5"
                />
                <div className={styles.characterCount}>
                  {formData.description.length} characters (minimum 50 required)
                </div>
                {errors.description && (
                  <div className={styles.errorMessage}>
                    {errors.description}
                  </div>
                )}
              </div>

              <div className={styles.row}>
                <label htmlFor="image">Property Image URL (Optional)</label>
                <input
                  type="url"
                  id="image"
                  value={formData.image}
                  onChange={(e) => handleInputChange("image", e.target.value)}
                  placeholder="https://example.com/property-image.jpg"
                />
                <div className={styles.imageHint}>
                  Add a high-quality image URL to make your listing stand out
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? "Creating Listing..." : "List My Property"}
              </button>

              {contextError && (
                <div className={styles.contextError}>{contextError}</div>
              )}
            </form>
          )}

          <div className={styles.helpText}>
            Need help?{" "}
            <button
              type="button"
              onClick={goToHome}
              className={styles.linkButton}
            >
              Go back to homepage
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
