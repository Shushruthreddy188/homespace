import { useMemo, useState } from "react";

/**
 * Client-side pagination shared by the property lists (Buy, Favorites, UserListings).
 * Returns the current page's slice plus the metadata the <Pagination> component needs.
 */
export function usePagination(items, itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const list = items || [];
  const totalPages = Math.max(1, Math.ceil(list.length / itemsPerPage));

  // Clamp so the view stays valid when the list shrinks (e.g. after filtering).
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentItems = useMemo(
    () => list.slice(startIndex, endIndex),
    [list, startIndex, endIndex],
  );

  return {
    currentPage: page,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    currentItems,
    total: list.length,
  };
}
