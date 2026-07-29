// Real authentication context (replaces the former fake/localStorage-only version).
//
// - The access token is held in memory by the API client (src/api/client.js).
// - The refresh token is an httpOnly cookie; on load we attempt a silent refresh to
//   restore the session.
// - A non-sensitive copy of the user PROFILE is cached in localStorage purely for
//   instant UI hydration (never the token).
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import {
  apiFetch,
  refreshSession,
  setAccessToken,
  BASE_URL,
} from "../api/client";

const AuthContext = createContext();

const USER_CACHE_KEY = "hs_auth_user";

const initialState = {
  user: null,
  isAuthenticated: false,
  authError: null,
  isLoading: true, // true until the initial silent-refresh resolves
};

function reducer(state, action) {
  switch (action.type) {
    case "login":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        authError: null,
        isLoading: false,
      };
    case "logout":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        authError: null,
        isLoading: false,
      };
    case "error":
      return {
        ...state,
        authError: action.payload,
        isAuthenticated: false,
        user: null,
        isLoading: false,
      };
    case "loading/done":
      return { ...state, isLoading: false };
    default:
      throw new Error("Unknown action");
  }
}

function cacheUser(user) {
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    /* ignore quota/serialization errors */
  }
}

function clearCachedUser() {
  try {
    localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// eslint-disable-next-line react/prop-types
function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user, isAuthenticated, authError, isLoading } = state;

  // On mount, try to restore a session from the refresh cookie.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await refreshSession();
        if (!active) return;
        if (data?.user) {
          cacheUser(data.user);
          dispatch({ type: "login", payload: data.user });
        } else {
          dispatch({ type: "loading/done" });
        }
      } catch {
        if (active) {
          clearCachedUser();
          dispatch({ type: "loading/done" });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (emailOrPhone, password) => {
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });

      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Invalid credentials"
            : "Login failed. Please try again.";
        dispatch({ type: "error", payload: msg });
        return false;
      }

      const data = await res.json();
      setAccessToken(data.accessToken);
      cacheUser(data.user);
      dispatch({ type: "login", payload: data.user });
      return true;
    } catch (err) {
      console.error("Login error:", err);
      dispatch({ type: "error", payload: "Login failed. Please try again." });
      return false;
    }
  }, []);

  const register = useCallback(async (form) => {
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        let msg = "Registration failed. Please try again.";
        if (res.status === 409) msg = "An account with that email already exists";
        else if (res.status === 400) msg = "Please check your details and try again";
        dispatch({ type: "error", payload: msg });
        return { ok: false, error: msg };
      }

      const data = await res.json();
      setAccessToken(data.accessToken);
      cacheUser(data.user);
      dispatch({ type: "login", payload: data.user });
      return { ok: true };
    } catch (err) {
      console.error("Register error:", err);
      const msg = "Registration failed. Please try again.";
      dispatch({ type: "error", payload: msg });
      return { ok: false, error: msg };
    }
  }, []);

  // Kick off the Google OAuth2 authorization-code flow (full-page redirect).
  const loginWithGoogle = useCallback(() => {
    window.location.href = `${BASE_URL}/oauth2/authorization/google`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" }, false);
    } catch {
      /* best-effort; clear client state regardless */
    }
    setAccessToken(null);
    clearCachedUser();
    dispatch({ type: "logout" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        authError,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
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
