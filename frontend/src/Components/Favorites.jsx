import { useMemo, useState, useEffect } from "react";
import styles from "../Pages/Buy.module.css"; // reusing Buy styles for consistent layout
import { useAuth } from "../contexts/FakeAuthContext";
import PropertyCard from "./Propertycard";
import { useProperties } from "../contexts/PropertiesContext";

export default function Favorites() {
  // Get the logged-in user
  const { user } = useAuth();
  const { properties, isLoading, error, updateFavorites, favoriteIds } =
    useProperties();

  const userId = user?.id || null;

  // Store favorites in local state and sync with user.favorites
  const [favorites, setFavorites] = useState([]);

  // Sync local state with user.favorites when user changes
  useEffect(() => {
    setFavorites(favoriteIds || []);
  }, [favoriteIds]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get favorite properties by matching IDs
  const favoriteProperties = useMemo(() => {
    if (!favoriteIds || favoriteIds.length === 0) return [];

    const favoriteProperties = properties
      .filter((property) => favorites.includes(property.id))
      .map((property) => ({
        ...property,
      }));

    return favoriteProperties;
  }, [favoriteIds, properties, favorites]);

  // Pagination calculations
  const totalPages = Math.ceil(favoriteProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = favoriteProperties.slice(startIndex, endIndex);

  // Handle favorite toggle (remove from favorites)
  const handleFavorite = async (property) => {
    console.log("Toggling favorite for property:", property);
    if (!user?.id) {
      alert("Please sign in to save favorites.");
      return;
    }

    try {
      const propertyId = property.id;
      const currentFavorites = favoriteIds || [];
      console.log("Current favorites:", currentFavorites);

      let updatedFavorites;
      if (currentFavorites.includes(propertyId)) {
        // Remove from favorites
        updatedFavorites = currentFavorites.filter((id) => id !== propertyId);
      } else {
        // Add to favorites
        updatedFavorites = [...currentFavorites, propertyId];
      }

      // Update local state immediately for instant UI feedback
      setFavorites(updatedFavorites);

      // Update in context/backend
      await updateFavorites(updatedFavorites);
    } catch (error) {
      // Revert local state if backend update fails
      setFavorites(favoriteIds || []);
      alert("Failed to update favorites. Please try again.");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.querySelector(`.${styles.propertiesGrid}`)?.scrollTo(0, 0);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  // Show login message if user not logged in
  if (!userId) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.resultsInfo}>
          Please log in to view your favorites.
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.loading}>Loading your favorites...</div>
      </div>
    );
  }

  // Show error state
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
      <div className={styles.resultsInfo}>
        <span>
          {favoriteProperties.length} favorite properties
          {totalPages > 1 && (
            <span className={styles.pageInfo}>
              {" "}
              • Showing {startIndex + 1}-
              {Math.min(endIndex, favoriteProperties.length)} of{" "}
              {favoriteProperties.length}
            </span>
          )}
        </span>
      </div>

      {favoriteProperties.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No favorites yet!</h3>
          <p>Browse properties and click the heart icon to save them here.</p>
        </div>
      ) : (
        <>
          <div className={styles.propertiesGrid}>
            {currentItems.map((property) => {
              const key = `${property.kind || property.listingType}-${
                property.id
              }`;
              return (
                <PropertyCard
                  key={key}
                  property={property}
                  onFavorite={handleFavorite}
                  isFavorited={favoriteIds.includes(property.id)}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={`${styles.pageBtn} ${
                  currentPage === 1 ? styles.disabled : ""
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              {generatePageNumbers().map((page) => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${
                    currentPage === page ? styles.active : ""
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className={`${styles.pageBtn} ${
                  currentPage === totalPages ? styles.disabled : ""
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
