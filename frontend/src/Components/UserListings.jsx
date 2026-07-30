import { useMemo } from "react";
import styles from "../pages/Buy.module.css";
import { useAuth } from "../contexts/AuthContext";
import { useProperties } from "../contexts/PropertiesContext";
import { usePagination } from "../Hooks/usePagination";
import { useFavoriteToggle } from "../Hooks/useFavoriteToggle";
import PropertyCard from "./PropertyCard";
import Pagination from "./Pagination";

// Owner id can arrive as ownerId, owner.id, or a bare owner id.
function ownerId(p) {
  return p.ownerId ?? (typeof p.owner === "object" ? p.owner?.id : p.owner);
}

export default function UserListings() {
  const { user } = useAuth();
  const { properties, isLoading } = useProperties();
  const { toggleFavorite, isFavorited } = useFavoriteToggle();

  const currentUserId = user?.id ?? null;

  const listedProperties = useMemo(() => {
    if (!currentUserId) return [];
    return (properties || []).filter(
      (p) => Number(ownerId(p)) === Number(currentUserId),
    );
  }, [properties, currentUserId]);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    currentItems,
  } = usePagination(listedProperties, 10);

  if (!currentUserId) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.resultsInfo}>
          Please log in to view your listings.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.loading}>Loading your listings…</div>
      </div>
    );
  }

  return (
    <div className={styles.buyContainer}>
      <div className={styles.listHeader}>
        <h1 className={styles.listTitle}>Your Listings</h1>
        <span className={styles.listCount}>
          {listedProperties.length} listed
          {totalPages > 1 && (
            <span className={styles.pageInfo}>
              {" "}· {startIndex + 1}–
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
