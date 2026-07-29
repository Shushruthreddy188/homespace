package com.homespace.api.repo;

import com.homespace.api.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  @Modifying
  @Query("update RefreshToken t set t.revoked = true where t.userId = :userId and t.revoked = false")
  void revokeAllForUser(@Param("userId") Long userId);

  @Modifying
  @Query("delete from RefreshToken t where t.expiresAt < :now")
  void deleteAllExpired(@Param("now") Instant now);
}
