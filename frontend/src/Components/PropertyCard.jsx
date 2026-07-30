/* eslint-disable react/prop-types */
import { useState, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import ContactAgentCard from "./ContactAgentCard";
import styles from "../pages/Buy.module.css";

const fmt = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString() : n);

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

  const {
    name,
    address,
    minPrice,
    maxPrice,
    minBeds,
    maxBeds,
    description,
    image,
    listingType,
  } = property;

  const isRent = String(listingType).toLowerCase() === "rent";
  const bedsLabel =
    minBeds === maxBeds
      ? `${minBeds} Bed${minBeds > 1 ? "s" : ""}`
      : `${minBeds}–${maxBeds} Beds`;

  return (
    <article className={styles.propertyCard}>
      <div className={styles.imageContainer}>
        <span className={`${styles.typeBadge} ${isRent ? "" : styles.sale}`}>
          {isRent ? "For Rent" : "For Sale"}
        </span>
        <img src={image} alt={name} className={styles.propertyImage} />

        <button
          type="button"
          className={styles.favoriteBtn}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorited}
          onClick={(e) => {
            onFavorite?.(property);
            e.currentTarget.blur();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill={isFavorited ? "var(--color-accent)" : "none"}
            stroke={isFavorited ? "var(--color-accent)" : "#37414a"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <div className={styles.propertyInfo}>
        <div className={styles.priceRange}>
          ${fmt(minPrice)} – ${fmt(maxPrice)}
          {isRent && <span className={styles.priceUnit}> /mo</span>}
        </div>

        <h3 className={styles.propertyName}>{name}</h3>

        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {bedsLabel}
          </span>
        </div>

        <div className={styles.address}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {address}
        </div>

        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.cardFooter}>
          <div className={styles.contactAgentWrap}>
            <button
              ref={btnRef}
              type="button"
              className={styles.contactAgentBtn}
              onClick={() => setShowAgent((v) => !v)}
            >
              Contact Agent
            </button>

            {showAgent && (
              <ContactAgentCard
                anchorRef={btnRef}
                agent={agent}
                onClose={() => setShowAgent(false)}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
