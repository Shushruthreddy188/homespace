import { Link } from "react-router-dom";
import { useState } from "react";
import PageNav from "../Components/PageNav";
import styles from "./Homepage.module.css";

export default function Homepage() {
  const [searchType, setSearchType] = useState("For Sale");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search logic here
    console.log(`Searching for ${searchType}: ${searchQuery}`);
  };

  return (
    <main className={styles.homepage}>
      <PageNav />

      <section>
        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.dropdownContainer}>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className={styles.dropdown}
              >
                <option value="For Sale">For Sale</option>
                <option value="For Rent">For Rent</option>
              </select>
              <svg
                className={styles.dropdownIcon}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                placeholder="Place, Neighborhood, School or Agent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 21L16.514 16.506M19 10.5C19 15.194 15.194 19 10.5 19S2 15.194 2 10.5 5.806 2 10.5 2 19 5.806 19 10.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>

        <h1>
          New campus, new job, new city.
          <br />
          HomeSpace gets you a place in minutes.
        </h1>
        <h2>
          Find apartments the simple way: city, price, beds, baths—done.
          HomeSpace shows crisp photos and key facts in a calm layout so the
          right place stands out immediately.
        </h2>
        <Link to="/login" className="cta">
          Find your place
        </Link>
      </section>
    </main>
  );
}
