import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Landing page after a Google login redirect. The backend has already set the httpOnly
 * refresh cookie, so the AuthProvider's silent refresh restores the session. We just
 * wait for that to resolve, then route the user into the app (or back to login on error).
 */
export default function OAuthCallback() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      navigate("/AppLayout", { replace: true });
    } else {
      navigate("/login?error=google", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#444",
      }}
    >
      Signing you in…
    </main>
  );
}
