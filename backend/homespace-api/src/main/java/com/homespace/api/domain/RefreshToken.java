package com.homespace.api.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A server-side refresh token. We store only a SHA-256 hash of the random token
 * value (never the raw value), so a database leak cannot be used to mint sessions.
 * Tokens are single-use: each refresh rotates to a new token and revokes the old one.
 */
@Entity
@Table(name = "refresh_tokens", indexes = @Index(name = "idx_refresh_token_hash", columnList = "token_hash"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "token_hash", nullable = false, unique = true, length = 64)
  private String tokenHash;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "revoked", nullable = false)
  private boolean revoked;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;
}
