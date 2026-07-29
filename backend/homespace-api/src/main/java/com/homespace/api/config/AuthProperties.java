package com.homespace.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Strongly-typed binding for our auth-related configuration (see application*.properties).
 */
@ConfigurationProperties(prefix = "app")
public record AuthProperties(Jwt jwt, Auth auth, Oauth2 oauth2) {

  public record Jwt(String secret, long accessTokenTtlSeconds, long refreshTokenTtlSeconds) {}

  public record Auth(Cookie cookie) {
    public record Cookie(boolean secure, String sameSite) {}
  }

  public record Oauth2(String frontendRedirectUri) {}
}
