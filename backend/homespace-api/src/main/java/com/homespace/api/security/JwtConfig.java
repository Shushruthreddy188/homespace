package com.homespace.api.security;

import com.homespace.api.config.AuthProperties;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Beans for hashing passwords and for signing/verifying our own HS256 access tokens.
 */
@Configuration
public class JwtConfig {

  private final SecretKey key;

  public JwtConfig(AuthProperties props) {
    byte[] secretBytes = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
    if (secretBytes.length < 32) {
      throw new IllegalStateException(
          "app.jwt.secret must be at least 32 bytes for HS256 signing");
    }
    this.key = new SecretKeySpec(secretBytes, "HmacSHA256");
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public JwtEncoder jwtEncoder() {
    return new NimbusJwtEncoder(new ImmutableSecret<>(key));
  }

  @Bean
  public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withSecretKey(key)
        .macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256)
        .build();
  }
}
