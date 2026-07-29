// Backwards-compatible shim.
//
// Authentication is now real (JWT access token + httpOnly refresh cookie + optional
// Google OAuth). The implementation moved to ./AuthContext. This file is kept only so
// existing `import { useAuth } from ".../FakeAuthContext"` paths continue to resolve.
export { AuthProvider, useAuth } from "./AuthContext";
