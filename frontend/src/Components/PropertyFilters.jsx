// src/components/PropertyFilters.jsx

import PropTypes from "prop-types";
import styles from "../pages/Buy.module.css"; // or reuse an existing module

function PropertyFilters({
  priceValue,
  bedsValue,
  onPriceChange,
  onBedsChange,
  onApply,
}) {
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={priceValue}
          onChange={(e) => onPriceChange?.(e.target.value)}
        >
          <option value="">Price Range</option>
          <option value="400-600">$400 - $600</option>
          <option value="600-800">$600 - $800</option>
          <option value="800-1000">$800 - $1000</option>
        </select>

        <select
          className={styles.filterSelect}
          value={bedsValue}
          onChange={(e) => onBedsChange?.(e.target.value)}
        >
          <option value="">Bedrooms</option>
          <option value="1">1 Bedroom</option>
          <option value="2">2 Bedrooms</option>
          <option value="3+">3+ Bedrooms</option>
        </select>

        <button type="button" className={styles.filterBtn} onClick={onApply}>
          Apply Filters
        </button>
      </div>
    </div>
  );
}

PropertyFilters.propTypes = {
  priceValue: PropTypes.string,
  bedsValue: PropTypes.string,
  onPriceChange: PropTypes.func,
  onBedsChange: PropTypes.func,
  onApply: PropTypes.func,
};

export default PropertyFilters;
