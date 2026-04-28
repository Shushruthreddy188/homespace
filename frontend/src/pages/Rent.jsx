import { useMemo, useState } from "react";
import styles from "./Buy.module.css";
import { useAuth } from "../contexts/FakeAuthContext";
import { useProperties } from "../contexts/PropertiesContext";
import PropertyCard from "../Components/PropertyCard";
import PropertyFilters from "../Components/PropertyFilters";

function normalize(list) {
  return (list || []).map((p) => ({
    ...p,
    imageUrl: p.image || p.imageUrl || "",
  }));
}

export default function Rent() {
  // Get the logged-in user from auth context
  const { user } = useAuth();

  // Get properties and favorites from global context
  const { properties, isLoading, error, updateFavorites, favoriteIds } =
    useProperties();

  const [price, setPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [applied, setApplied] = useState({ price: "", beds: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter properties for buy listings only
  const rentProperties = useMemo(() => {
    return normalize(properties.filter((p) => p.listingType === "rent"));
  }, [properties]);

  // Apply filters to buy properties
  const filtered = useMemo(() => {
    let list = rentProperties.slice();

    if (applied.price) {
      const [min, max] = applied.price.split("-").map(Number);
      list = list.filter((p) => !(p.maxPrice < min || p.minPrice > max));
    }

    if (applied.beds) {
      if (applied.beds === "3+") {
        list = list.filter((p) => p.maxBeds >= 3);
      } else {
        const b = Number(applied.beds);
        list = list.filter((p) => p.minBeds <= b && p.maxBeds >= b);
      }
    }

    return list;
  }, [rentProperties, applied]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filtered.slice(startIndex, endIndex);

  const handleApply = () => {
    setApplied({ price, beds });
    setCurrentPage(1);
  };

  // Toggle favorite using global context
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

  // Check if property is favorited
  const isPropertyFavorited = (propertyId) => {
    return favoriteIds.includes(propertyId);
  };

  if (isLoading) return <div className={styles.loading}>Loading…</div>;

  if (error) {
    return (
      <div className={styles.buyContainer}>
        <div className={styles.resultsInfo} style={{ color: "red" }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.buyContainer}>
      <PropertyFilters
        priceValue={price}
        bedsValue={beds}
        onPriceChange={setPrice}
        onBedsChange={setBeds}
        onApply={handleApply}
      />

      <div className={styles.resultsInfo}>
        <span>
          {filtered.length} properties found
          {totalPages > 1 && (
            <span className={styles.pageInfo}>
              {" "}
              • Showing {startIndex + 1}-{Math.min(endIndex, filtered.length)}{" "}
              of {filtered.length}
            </span>
          )}
        </span>
      </div>

      <div className={styles.propertiesGrid}>
        {currentItems.map((property) => {
          const propertyId = property.id;
          const isFav = isPropertyFavorited(propertyId);

          return (
            <PropertyCard
              key={propertyId}
              property={property}
              onFavorite={handleFavorite}
              onContact={(property) =>
                alert(`Contact agent for: ${property.name}`)
              }
              isFavorited={isFav}
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
    </div>
  );
}
