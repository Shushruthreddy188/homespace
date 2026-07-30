import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Buy.module.css";
import { useProperties } from "../contexts/PropertiesContext";
import { applyListingFilters } from "../utils/propertyFilters";
import { usePagination } from "../Hooks/usePagination";
import { useFavoriteToggle } from "../Hooks/useFavoriteToggle";
import PropertyCard from "../Components/PropertyCard";
import PropertyFilters from "../Components/PropertyFilters";
import Pagination from "../Components/Pagination";

function normalize(list) {
  return (list || []).map((p) => ({ ...p, imageUrl: p.image || p.imageUrl || "" }));
}

export default function Buy() {
  const location = useLocation();
  const { properties, isLoading, error, listingFilters, setListingFilters } =
    useProperties();
  const { toggleFavorite, isFavorited } = useFavoriteToggle();

  // Pending selections; committed to the shared filter on "Apply".
  const [price, setPrice] = useState(listingFilters.price);
  const [beds, setBeds] = useState(listingFilters.beds);

  const currentListingType = useMemo(() => {
    if (location.pathname.includes("/rent")) return "rent";
    if (location.pathname.includes("/buy")) return "buy";
    return "all";
  }, [location.pathname]);

  const pageTitle =
    currentListingType === "rent"
      ? "Homes for Rent"
      : currentListingType === "buy"
        ? "Homes for Sale"
        : "All Homes";

  const currentProperties = useMemo(
    () =>
      normalize(
        properties.filter(
          (p) => p.listingType === currentListingType || p.listingType === "sell",
        ),
      ),
    [currentListingType, properties],
  );

  const filtered = useMemo(
    () => applyListingFilters(currentProperties, listingFilters),
    [currentProperties, listingFilters],
  );

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    currentItems,
  } = usePagination(filtered, 10);

  const handleApply = () => {
    setListingFilters({ price, beds });
    setCurrentPage(1);
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
      <div className={styles.listHeader}>
        <h1 className={styles.listTitle}>{pageTitle}</h1>
        <span className={styles.listCount}>
          {filtered.length} {filtered.length === 1 ? "home" : "homes"}
          {totalPages > 1 && (
            <span className={styles.pageInfo}>
              {" "}· {startIndex + 1}–{Math.min(endIndex, filtered.length)} of{" "}
              {filtered.length}
            </span>
          )}
        </span>
      </div>

      <PropertyFilters
        priceValue={price}
        bedsValue={beds}
        onPriceChange={setPrice}
        onBedsChange={setBeds}
        onApply={handleApply}
      />

      <div className={styles.propertiesGrid}>
        {currentItems.length === 0 && (
          <div className={styles.emptyState}>
            No homes match your filters. Try widening your search.
          </div>
        )}
        {currentItems.map((property) => (
          <PropertyCard
            key={property.id}
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
    </div>
  );
}
