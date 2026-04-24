/* eslint-disable react/prop-types */

import { useState, useMemo, useRef } from "react";
import { useAuth } from "../contexts/FakeAuthContext";
import ContactAgentCard from "./ContactAgentCard";
import styles from "../pages/Buy.module.css";

// eslint-disable-next-line react/prop-types
function PropertyCard({ property, onFavorite, isFavorited = false }) {
  const { user } = useAuth();
  const [showAgent, setShowAgent] = useState(false);
  const btnRef = useRef(null);

  const agent = useMemo(() => {
    const fullName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.name ||
      "Current User";
    return {
      fullName,
      company: user?.company || "Agent",
      email: user?.email || "",
      phone: user?.phone || "",
      photoUrl: user?.avatarUrl || "",
    };
  }, [user]);
  // eslint-disable-next-line react/prop-types
  const {
    name,
    address,
    minPrice,
    maxPrice,
    minBeds,
    maxBeds,
    description,
    image,
  } = property;

  return (
    <div className={styles.propertyCard}>
      <div className={styles.imageContainer}>
        <img src={image} alt={name} className={styles.propertyImage} />
      </div>

      <div className={styles.propertyInfo}>
        <div className={styles.priceRange}>
          ${minPrice} - ${maxPrice} per month
        </div>
        <h3 className={styles.propertyName}>{name}</h3>
        <div className={styles.bedInfo}>
          {minBeds === maxBeds
            ? `${minBeds} Bed${minBeds > 1 ? "s" : ""}`
            : `${minBeds} - ${maxBeds} Beds`}
        </div>
        <div className={styles.address}>{address}</div>

        <p className={styles.description}>
          {description.length > 200
            ? `${description.substring(0, 200)}...`
            : description}
        </p>

        <div className={styles.contactAgentWrap}>
          <button
            ref={btnRef}
            type="button"
            className={styles.contactAgentBtn}
            onClick={() => setShowAgent((v) => !v)}
          >
            Need Help? Contact Agent
          </button>
        </div>
      </div>

      {showAgent && (
        <ContactAgentCard
          anchorRef={btnRef}
          agent={agent}
          onClose={() => setShowAgent(false)}
        />
      )}

      <button
        type="button"
        className={`${styles.favoriteBtn} ${
          isFavorited ? styles.favorited : ""
        }`}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorited}
        onClick={(e) => {
          onFavorite?.(property);
          e.currentTarget.blur();
        }}
        onMouseLeave={(e) => e.currentTarget.blur()}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill={isFavorited ? "#ff3040" : "none"}
          stroke={isFavorited ? "#ff3040" : "#262626"}
          strokeWidth={isFavorited ? "0" : "1.5"}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            cursor: "pointer",
            transition: "all 0.2s ease",
            transform: isFavorited ? "scale(1.1)" : "scale(1)",
          }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
}

PropertyCard.propTypes = {
  // …
};

export default PropertyCard;
