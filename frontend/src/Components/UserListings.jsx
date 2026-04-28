import { useEffect, useMemo, useState } from "react";
import styles from "../pages/Buy.module.css";
import { useAuth } from "../contexts/FakeAuthContext";
import { useProperties } from "../contexts/PropertiesContext";
import PropertyCard from "./PropertyCard";

function normalize(list) {
  return (list || []).map((p) => ({
    ...p,
    imageUrl: p.image || p.imageUrl || "",
    listingType: p.listingType || p.kind || "", // tolerate both keys
  }));
}

export default function UserListings() {
  // Get the logged-in user (fallback to localStorage)
  const { user } = useAuth();
  const sessionUser =
    user ?? JSON.parse(localStorage.getItem("user") || "null");
  const currentUserId = sessionUser?.id;

  const { properties, updateFavorites, favoriteIds } = useProperties();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userListings, setUserListings] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // Derive owner id robustly: ownerId, owner.id, or owner (if server sent just an id)
      const mine = (properties || []).filter((p) => {
        const ownerCandidate =
          p.ownerId ?? (typeof p.owner === "object" ? p.owner?.id : p.owner);
        return Number(ownerCandidate) === Number(currentUserId);
      });

      setUserListings(mine);
      // reset to page 1 if current page is out of range after filtering
      if (mine.length && (currentPage - 1) * itemsPerPage >= mine.length) {
        setCurrentPage(1);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load your listings.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, currentUserId, properties]);

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

      await updateFavorites(updatedFavorites);
    } catch (error) {
      alert("Failed to update favorites. Please try again.");
    }
  };
  // Check if property is favorited
  const isPropertyFavorited = (propertyId) => {
    return favoriteIds.includes(propertyId);
  };

  const listedProperties = useMemo(
    () => normalize(userListings),
    [userListings]
  );

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(listedProperties.length / itemsPerPage)
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = listedProperties.slice(startIndex, endIndex);

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

  if (!currentUserId) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.resultsInfo}>
          Please log in to view your listings.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.loading}>Loading your listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.resultsInfo} style={{ color: "red" }}>
          Error loading listings: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.buyContainer}>
      <div className={styles.resultsInfo}>
        <span>
          {listedProperties.length} properties listed by you
          {totalPages > 1 && (
            <span className={styles.pageInfo}>
              {" "}
              • Showing {listedProperties.length ? startIndex + 1 : 0}-
              {Math.min(endIndex, listedProperties.length)} of{" "}
              {listedProperties.length}
            </span>
          )}
        </span>
      </div>

      {listedProperties.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No listings yet!</h3>
          <p>Create your first property listing to see it here.</p>
        </div>
      ) : (
        <>
          <div className={styles.propertiesGrid}>
            {currentItems.map((property) => {
              const key = `${property.listingType || property.kind}-${
                property.id
              }`;
              const propertyId = property.id;
              const isFav = isPropertyFavorited(propertyId);
              return (
                <div key={key} className={styles.propertyCardWrapper}>
                  <PropertyCard
                    key={property.id ?? property.name}
                    property={property}
                    onFavorite={handleFavorite}
                    onContact={(property) =>
                      alert(`Contact agent for: ${property.name}`)
                    }
                    isFavorited={isFav}
                  />
                </div>
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
