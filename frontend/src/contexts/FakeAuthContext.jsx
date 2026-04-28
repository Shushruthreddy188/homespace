// contexts/FakeAuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from "react";

const AuthContext = createContext();

// Updated to match your Spring Boot backend
// const BASE_URL = "http://localhost:4000";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  user: null,
  isAuthenticated: false,
  authError: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "login":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        authError: null,
      };
    case "logout":
      return { ...state, user: null, isAuthenticated: false, authError: null };
    case "error":
      return {
        ...state,
        authError: action.payload,
        isAuthenticated: false,
        user: null,
      };
    default:
      throw new Error("Unknown action");
  }
}

// eslint-disable-next-line react/prop-types
function AuthProvider({ children }) {
  const [{ user, isAuthenticated, authError }, dispatch] = useReducer(
    reducer,
    initialState,
  );

  // (Optional) hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("hs_auth_user");
    if (saved) dispatch({ type: "login", payload: JSON.parse(saved) });
  }, []);

  async function login(emailOrPhone, password) {
    try {
      console.log("Attempting login with", { emailOrPhone, password });

      // Call the backend login endpoint with POST request
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone,
          password: password,
        }),
      });

      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 401) {
          dispatch({ type: "error", payload: "Invalid credentials" });
          return;
        } else if (response.status === 404) {
          dispatch({
            type: "error",
            payload: "No account found for those credentials",
          });
          return;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const user = await response.json();
      console.log("Login successful, user data:", user);

      // Create safe user object (assuming backend returns full user)
      const safeUser = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar || "https://i.pravatar.cc/100?u=hs",
        favorites: user.favorites,
        createdAt: user.createdAt,
      };
      console.log("Safe user object:", safeUser);
      localStorage.setItem("hs_auth_user", JSON.stringify(safeUser));
      dispatch({ type: "login", payload: safeUser });
    } catch (err) {
      console.error("Login error:", err);
      dispatch({ type: "error", payload: "Login failed. Please try again." });
    }
  }

  function logout() {
    localStorage.removeItem("hs_auth_user");
    dispatch({ type: "logout" });
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, authError, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("AuthContext was used outside AuthProvider");
  return context;
}

export { AuthProvider, useAuth };
