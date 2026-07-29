package com.homespace.api.security;

import com.homespace.api.config.AuthProperties;
import com.homespace.api.domain.User;
import com.homespace.api.repo.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.HashSet;

/**
 * Runs after a successful Google login. Provisions (or links) a local user, mints our own
 * refresh token into an httpOnly cookie, and redirects the browser to the frontend. The
 * frontend then calls /auth/refresh to obtain an in-memory access token — so no token is
 * ever placed in the redirect URL.
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

  private final UserRepository users;
  private final RefreshTokenService refreshTokens;
  private final CookieUtil cookieUtil;
  private final String frontendRedirectUri;

  public OAuth2LoginSuccessHandler(UserRepository users,
                                   RefreshTokenService refreshTokens,
                                   CookieUtil cookieUtil,
                                   AuthProperties props) {
    this.users = users;
    this.refreshTokens = refreshTokens;
    this.cookieUtil = cookieUtil;
    this.frontendRedirectUri = props.oauth2().frontendRedirectUri();
  }

  @Override
  public void onAuthenticationSuccess(HttpServletRequest request,
                                      HttpServletResponse response,
                                      Authentication authentication) throws IOException {
    OAuth2User principal = (OAuth2User) authentication.getPrincipal();

    String sub = stringAttr(principal, "sub");
    String email = stringAttr(principal, "email");
    if (email == null || email.isBlank()) {
      getRedirectStrategy().sendRedirect(request, response, frontendRedirectUri + "?error=no_email");
      return;
    }

    User user = users.findByEmail(email).orElseGet(User::new);
    boolean isNew = user.getId() == null;
    OffsetDateTime now = OffsetDateTime.now();

    if (isNew) {
      user.setId(now.toInstant().toEpochMilli());
      user.setEmail(email);
      user.setFirstName(stringAttr(principal, "given_name"));
      user.setLastName(stringAttr(principal, "family_name"));
      user.setRole("user");
      user.setFavorites(new HashSet<>());
      user.setCreatedAt(now);
    }
    // Link/refresh provider info on every Google login.
    user.setAuthProvider("GOOGLE");
    user.setProviderId(sub);
    if (user.getAvatar() == null) {
      user.setAvatar(stringAttr(principal, "picture"));
    }
    user.setUpdatedAt(now);
    User saved = users.save(user);

    RefreshTokenService.IssuedToken issued = refreshTokens.issue(saved.getId());
    response.addHeader(HttpHeaders.SET_COOKIE,
        cookieUtil.build(issued.rawValue(), issued.ttlSeconds()).toString());

    getRedirectStrategy().sendRedirect(request, response, frontendRedirectUri);
  }

  private static String stringAttr(OAuth2User user, String key) {
    Object v = user.getAttributes().get(key);
    return v == null ? null : v.toString();
  }
}
