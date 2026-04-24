import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import User from "./User"; // 👈 import the User module
import styles from "./PageNav.module.css";
import { useAuth } from "../contexts/FakeAuthContext"; // 👈 use auth context

function PageNav() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className={styles.nav}>
      <Logo />

      <ul>
        <li>
          <NavLink to="/applayout">Homes</NavLink>
        </li>

        <li>
          {isAuthenticated ? (
            <User />
          ) : (
            <NavLink to="/login" style={{ color: "orange" }}>
              Sign In
            </NavLink>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default PageNav;
