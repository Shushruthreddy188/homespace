import PropTypes from "prop-types";
import styles from "../pages/Buy.module.css";

const MAX_VISIBLE = 5;

function pageWindow(currentPage, totalPages) {
  let start = Math.max(1, currentPage - Math.floor(MAX_VISIBLE / 2));
  const end = Math.min(totalPages, start + MAX_VISIBLE - 1);
  if (end - start + 1 < MAX_VISIBLE) start = Math.max(1, end - MAX_VISIBLE + 1);

  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

/** Prev / numbered / Next pager shared by every property list. */
export default function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const go = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onChange(page);
    document.querySelector(`.${styles.propertiesGrid}`)?.scrollTo(0, 0);
  };

  return (
    <div className={styles.pagination}>
      <button
        className={`${styles.pageBtn} ${currentPage === 1 ? styles.disabled : ""}`}
        onClick={() => go(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {pageWindow(currentPage, totalPages).map((page) => (
        <button
          key={page}
          className={`${styles.pageBtn} ${currentPage === page ? styles.active : ""}`}
          onClick={() => go(page)}
        >
          {page}
        </button>
      ))}

      <button
        className={`${styles.pageBtn} ${currentPage === totalPages ? styles.disabled : ""}`}
        onClick={() => go(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
