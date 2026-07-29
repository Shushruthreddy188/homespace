package com.homespace.api.security;

import com.homespace.api.config.AuthProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

/**
 * Builds and reads the httpOnly refresh-token cookie. Secure/SameSite flags come from
 * config so dev (localhost, http, SameSite=Lax) and prod (cross-site, https,
 * SameSite=None; Secure) both work.
 */
@Component
public class CookieUtil {

  public static final String REFRESH_COOKIE = "hs_refresh";
  private static final String REFRESH_PATH = "/auth";

  private final boolean secure;
  private final String sameSite;

  public CookieUtil(AuthProperties props) {
    this.secure = props.auth().cookie().secure();
    this.sameSite = props.auth().cookie().sameSite();
  }

  public ResponseCookie build(String value, long maxAgeSeconds) {
    return ResponseCookie.from(REFRESH_COOKIE, value)
        .httpOnly(true)
        .secure(secure)
        .sameSite(sameSite)
        .path(REFRESH_PATH)
        .maxAge(maxAgeSeconds)
        .build();
  }

  /** A cookie that immediately expires the refresh cookie (used on logout). */
  public ResponseCookie expired() {
    return build("", 0);
  }

  public Optional<String> read(HttpServletRequest request) {
    if (request.getCookies() == null) return Optional.empty();
    return Arrays.stream(request.getCookies())
        .filter(c -> REFRESH_COOKIE.equals(c.getName()))
        .map(Cookie::getValue)
        .filter(v -> v != null && !v.isBlank())
        .findFirst();
  }
}
