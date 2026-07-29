// Central API client.
//
// The JWT access token lives only in memory (never localStorage), so it is not
// readable by injected scripts. The refresh token lives in an httpOnly cookie the
// browser sends automatically on /auth requests. On a 401 we transparently try to
// refresh the access token once and replay the request.

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

let accessToken = null;
let refreshInFlight = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

/**
 * Exchange the refresh cookie for a fresh access token. Concurrent callers share a
 * single in-flight request. Returns the parsed body ({ accessToken, user, ... }) on
 * success, or throws on failure.
 */
export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("refresh_failed");
        const data = await res.json();
        accessToken = data.accessToken || null;
        return data;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * fetch() wrapper that targets the API, attaches the bearer token and cookies, and
 * retries once through a silent refresh if the access token has expired.
 *
 * @param {string} path  API path beginning with "/" (e.g. "/users/1/favorites")
 */
export async function apiFetch(path, options = {}, retryOnAuthFail = true) {
  const headers = { ...(options.headers || {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retryOnAuthFail) {
    try {
      await refreshSession();
    } catch {
      return res; // refresh failed — let the caller handle the 401
    }
    return apiFetch(path, options, false);
  }

  return res;
}

export { BASE_URL };
