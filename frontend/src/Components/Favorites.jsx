import { useMemo } from "react";
import styles from "../pages/Buy.module.css";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertiesContext";
import { usePagination } from "../Hooks/usePagination";
import { useFavoriteToggle } from "../Hooks/useFavoriteToggle";
import PropertyCard from "./PropertyCard";
import Pagination from "./Pagination";

export default function Favorites() {
  const { user } = useAuth();
  const { properties, isLoading, error } = useProperties();
  const { toggleFavorite, isFavorited, favoriteIds } = useFavoriteToggle();

  const favoriteProperties = useMemo(
    () => properties.filter((p) => (favoriteIds || []).includes(p.id)),
    [properties, favoriteIds],
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    currentItems,
  } = usePagination(favoriteProperties, 10);

  if (!user?.id) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.resultsInfo}>
          Please log in to view your favorites.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.loading}>Loading your favorites…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.resultsInfo} style={{ color: "red" }}>
          Error loading favorites: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.buyContainer}>
      <div className={styles.listHeader}>
        <h1 className={styles.listTitle}>Your Favorites</h1>
        <span className={styles.listCount}>
          {favoriteProperties.length} saved
          {totalPages > 1 && (
            <span className={styles.pageInfo}>
              {" "}· {startIndex + 1}–
              {Math.min(endIndex, favoriteProperties.length)} of{" "}
              {favoriteProperties.length}
            </span>
          )}
        </span>
      </div>

      {favoriteProperties.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No favorites yet!</h3>
          <p>Browse properties and tap the heart icon to save them here.</p>
        </div>
      ) : (
        <>
          <div className={styles.propertiesGrid}>
            {currentItems.map((property) => (
              <PropertyCard
                key={`${property.listingType}-${property.id}`}
                property={property}
                onFavorite={toggleFavorite}
                isFavorited={isFavorited(property.id)}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
