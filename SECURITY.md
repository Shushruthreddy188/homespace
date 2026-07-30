# 🔐 HomeSpace — Security & Authentication

This document describes the authentication/authorization added to HomeSpace and how to
run it locally.

## What changed

Previously auth was a stand-in: passwords were stored and compared in **plaintext**, the
`GET /users` endpoint **returned password hashes/plaintext**, there were **no tokens**
(any client could read or modify any user's data by id), and the frontend just kept the
user object in `localStorage`.

The platform now uses a real, layered scheme:

| Layer | Implementation |
|-------|----------------|
| Password storage | **BCrypt** hashing (`BCryptPasswordEncoder`). Seeded/demo passwords are hashed on insert. |
| Session tokens | Self-issued **JWT** access tokens (HS256, 15 min) via Spring Security's `oauth2ResourceServer`. |
| Refresh tokens | Opaque, **rotating**, stored server-side as SHA-256 hashes; delivered in an **httpOnly cookie**. Reuse of a rotated token revokes the whole family. |
| Social login | **Google OAuth2 / OIDC** authorization-code flow → provisions/links a local user → mints our own JWT. |
| Authorization | Listings are publicly readable; user data requires a valid token and a user can only read/modify **their own** account/favorites (`403` otherwise). Listing **mutations are role-gated** — only `agent`/`admin` may create, edit, or delete listings (`403` for `user`). |
| Token storage (frontend) | Access token kept **in memory**; refresh token in the httpOnly cookie. Silent refresh on load and on `401`. |

### Key endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/register` | public | Create account, returns access token + sets refresh cookie |
| POST | `/auth/login` | public | Email/phone + password login |
| POST | `/auth/refresh` | refresh cookie | Rotate refresh token, issue new access token |
| POST | `/auth/logout` | refresh cookie | Revoke refresh token, clear cookie |
| GET | `/auth/me` | bearer | Current user |
| GET | `/oauth2/authorization/google` | public | Start Google login |
| GET | `/buyListings`, `/rentListings` | public | Browse listings |
| POST/PUT/DELETE | `/buyListings`, `/rentListings` | bearer + role `agent`/`admin` | Manage listings |
| GET/PUT/PATCH | `/users/{id}/favorites` | bearer (self only) | Favorites |

## Running locally

**Prerequisites:** Docker Desktop, JDK 17+ (JDK 21 works), Node 18+.

```bash
# 1. Start Postgres (host port 5433 -> container 5432)
docker compose up -d

# 2. Backend (uses the committed Maven wrapper; seeds data on first boot)
cd backend/homespace-api
SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
# -> http://localhost:4000

# 3. Frontend
cd frontend
npm install
npm run dev
# -> http://localhost:5173
```

The `dev` profile (`application-dev.properties`) points at the Docker Postgres, enables
seeding, and uses a **dev-only** JWT secret with `SameSite=Lax` / non-secure cookies
(fine on localhost). Demo login: `shushruth108@gmail.com` / `Shush@bd17`.

> **Windows/JDK note:** if Tomcat fails to start with `Unable to establish loopback
> connection` (an AF_UNIX temp-path issue when `java.io.tmpdir` is long), launch with a
> short temp dir, e.g. `./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Djava.io.tmpdir=C:\Temp"`.

## Enabling Google login

Google login is **off by default** and the app boots fine without it. To enable:

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth 2.0 Client ID** (type: *Web application*).
2. Add the authorized redirect URI:
   `http://localhost:4000/login/oauth2/code/google`
3. Provide the credentials to the backend (env vars, before `mvnw spring-boot:run`):

   ```bash
   export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=<your-client-id>
   export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=<your-client-secret>
   ```

4. Restart the backend and click **Continue with Google** on the login page. After
   Google authenticates, the browser returns to `http://localhost:5173/oauth/callback`,
   which silently exchanges the refresh cookie for an access token and enters the app.

## Production notes

- Set a strong `APP_JWT_SECRET` (≥ 32 bytes) — never use the dev secret.
- Frontend and API are on different sites in prod, so the refresh cookie defaults to
  `SameSite=None; Secure` (`APP_AUTH_COOKIE_SAMESITE` / `APP_AUTH_COOKIE_SECURE`) and
  requires HTTPS.
- Set `APP_CORS_ALLOWED_ORIGIN` to the deployed frontend origin(s).
- Set `APP_OAUTH2_FRONTEND_REDIRECT_URI` to the deployed `/oauth/callback` URL and add
  the matching Google redirect URI (`https://<api-host>/login/oauth2/code/google`).
