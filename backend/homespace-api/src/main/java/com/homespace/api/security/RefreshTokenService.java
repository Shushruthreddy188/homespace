package com.homespace.api.security;

import com.homespace.api.config.AuthProperties;
import com.homespace.api.domain.RefreshToken;
import com.homespace.api.repo.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Issues and validates opaque refresh tokens. The raw token is returned once (to be put
 * in an httpOnly cookie); only its SHA-256 hash is persisted. Each successful refresh
 * rotates the token (old one revoked, new one issued) to limit replay of a stolen token.
 */
@Service
public class RefreshTokenService {

  private final RefreshTokenRepository repo;
  private final long refreshTtlSeconds;
  private final SecureRandom random = new SecureRandom();

  public RefreshTokenService(RefreshTokenRepository repo, AuthProperties props) {
    this.repo = repo;
    this.refreshTtlSeconds = props.jwt().refreshTokenTtlSeconds();
  }

  /** Result of issuing a token: the raw value for the cookie plus its TTL. */
  public record IssuedToken(String rawValue, long ttlSeconds) {}

  @Transactional
  public IssuedToken issue(Long userId) {
    String raw = randomToken();
    Instant now = Instant.now();

    RefreshToken entity = RefreshToken.builder()
        .tokenHash(sha256(raw))
        .userId(userId)
        .expiresAt(now.plus(refreshTtlSeconds, ChronoUnit.SECONDS))
        .revoked(false)
        .createdAt(now)
        .build();
    repo.save(entity);

    return new IssuedToken(raw, refreshTtlSeconds);
  }

  /**
   * Validates a raw refresh token and rotates it. Returns the owning user id and the new
   * token, or throws if the token is unknown, revoked, or expired.
   */
  @Transactional
  public RotationResult rotate(String rawValue) {
    RefreshToken current = repo.findByTokenHash(sha256(rawValue))
        .orElseThrow(() -> new InvalidRefreshTokenException("Unknown refresh token"));

    if (current.isRevoked()) {
      // Reuse of an already-rotated token: revoke the whole family as a safety measure.
      repo.revokeAllForUser(current.getUserId());
      throw new InvalidRefreshTokenException("Refresh token already used");
    }
    if (current.getExpiresAt().isBefore(Instant.now())) {
      throw new InvalidRefreshTokenException("Refresh token expired");
    }

    current.setRevoked(true);
    repo.save(current);

    IssuedToken next = issue(current.getUserId());
    return new RotationResult(current.getUserId(), next);
  }

  public record RotationResult(Long userId, IssuedToken token) {}

  @Transactional
  public void revoke(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) return;
    repo.findByTokenHash(sha256(rawValue)).ifPresent(t -> {
      t.setRevoked(true);
      repo.save(t);
    });
  }

  @Transactional
  public void revokeAllForUser(Long userId) {
    repo.revokeAllForUser(userId);
  }

  public static class InvalidRefreshTokenException extends RuntimeException {
    public InvalidRefreshTokenException(String message) {
      super(message);
    }
  }

  private String randomToken() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private String sha256(String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (Exception e) {
      throw new IllegalStateException("SHA-256 not available", e);
    }
  }
}
