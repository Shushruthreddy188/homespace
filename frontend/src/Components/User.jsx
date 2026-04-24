import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/FakeAuthContext";
import styles from "./User.module.css";

function User() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  function goFavorites() {
    setOpen(false);
    navigate("/applayout/favorites");
  }

  function goMyListings() {
    setOpen(false);
    navigate("/applayout/userlistings");
  }

  const initials = useMemo(() => {
    if (!user) return "";
    const f = user.firstName || user.name?.split(" ")[0] || "";
    const l = user.lastName || user.name?.split(" ")[1] || "";
    return `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase() || "U";
  }, [user]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  // Close on click outside
  useEffect(() => {
    function onClickOutside(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Avatar can be <img> if avatar exists, else initials circle
  const Avatar = (
    <>
      {user?.avatar ? (
        <img className={styles.avatarImg} src={user.avatar} alt="" />
      ) : (
        <div className={styles.avatarCircle}>{initials}</div>
      )}
    </>
  );

  return (
    <div className={styles.user} ref={rootRef}>
      {/* Avatar Button */}
      <button
        type="button"
        className={styles.avatarButton}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
      >
        {Avatar}
      </button>

      {/* Dropdown Menu */}
      <div
        id="user-menu"
        role="menu"
        className={`${styles.menu} ${open ? styles.open : ""}`}
      >
        <div className={styles.header}>
          {Avatar}
          <div className={styles.meta}>
            <div className={styles.name}>
              {user?.firstName || user?.name || "User"} {user?.lastName || ""}
            </div>
            {user?.email && <div className={styles.email}>{user.email}</div>}
          </div>
        </div>

        {/* Menu Items */}
        <button
          type="button"
          role="menuitem"
          className={styles.menuItem}
          onClick={goFavorites}
        >
          <svg
            className={styles.menuIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M12 21s-6.5-3.8-9-7.6C1.3 10.8 2.2 7.8 4.7 6.6 6.4 5.8 8.4 6.1 9.7 7.4L12 9.7l2.3-2.3c1.3-1.3 3.3-1.6 5-0.8 2.5 1.2 3.4 4.2 1.7 6.8C18.5 17.2 12 21 12 21z"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Favourites
        </button>

        <button
          type="button"
          role="menuitem"
          className={styles.menuItem}
          onClick={goMyListings}
        >
          <svg
            className={styles.menuIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M3 10.5L12 4l9 6.5M5 10v9h14v-9"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 19v-5h6v5"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          My Listings
        </button>

        <div className={styles.divider} />

        {/* Logout Button */}
        <button
          type="button"
          role="menuitem"
          className={styles.logoutBtn}
          onClick={handleLogout}
          aria-label="Log out"
        >
          <svg
            className={styles.logoutIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d="M18 12H9m0 0l3-3m-3 3l3 3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

export default User;
