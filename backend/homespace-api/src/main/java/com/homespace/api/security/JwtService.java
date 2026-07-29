package com.homespace.api.security;

import com.homespace.api.config.AuthProperties;
import com.homespace.api.domain.User;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Issues our own signed access tokens. The token's subject is the user id;
 * the {@code role} claim drives method/endpoint authorization.
 */
@Service
public class JwtService {

  private final JwtEncoder encoder;
  private final long accessTtlSeconds;

  public JwtService(JwtEncoder encoder, AuthProperties props) {
    this.encoder = encoder;
    this.accessTtlSeconds = props.jwt().accessTokenTtlSeconds();
  }

  public String generateAccessToken(User user) {
    Instant now = Instant.now();
    String role = user.getRole() == null ? "user" : user.getRole();

    JwtClaimsSet claims = JwtClaimsSet.builder()
        .issuer("homespace-api")
        .issuedAt(now)
        .expiresAt(now.plus(accessTtlSeconds, ChronoUnit.SECONDS))
        .subject(String.valueOf(user.getId()))
        .claim("email", user.getEmail())
        .claim("role", role)
        .build();

    JwsHeader header = JwsHeader.with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).build();
    return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
  }

  public long getAccessTtlSeconds() {
    return accessTtlSeconds;
  }
}
