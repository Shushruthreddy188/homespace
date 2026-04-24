import { NavLink } from "react-router-dom";
import styles from "./AppNav.module.css";
import Logo from "./Logo";
import User from "./User";
import { useAuth } from "../contexts/FakeAuthContext";

function AppNav() {
  const { user, isAuthenticated } = useAuth();
  const isAgent = user?.role === "agent";

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="rent">Rent</NavLink>
          <NavLink to="buy">Buy</NavLink>
          {isAgent && <NavLink to="listing">List Property</NavLink>}
        </div>

        <div className={styles.center}>
          <Logo />
        </div>

        <div className={styles.right}>
          {isAuthenticated ? (
            <User />
          ) : (
            <NavLink
              to="/login"
              style={{
                color: "orange",
                fontSize: "1.5rem",
                fontWeight: 600,
                paddingRight: "2rem",
              }}
            >
              SIGN IN
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

export default AppNav;
