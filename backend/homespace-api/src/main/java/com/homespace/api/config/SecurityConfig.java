package com.homespace.api.config;

import com.homespace.api.security.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(AuthProperties.class)
public class SecurityConfig {

  private final CorsConfigurationSource corsConfigurationSource;

  // Qualify by name: Spring MVC also registers a CorsConfigurationSource
  // (mvcHandlerMappingIntrospector), so injection by type alone is ambiguous.
  public SecurityConfig(@Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfigurationSource) {
    this.corsConfigurationSource = corsConfigurationSource;
  }

  @Bean
  public SecurityFilterChain filterChain(
      HttpSecurity http,
      JwtAuthenticationConverter jwtAuthenticationConverter,
      ObjectProvider<ClientRegistrationRepository> clientRegistrationRepository,
      ObjectProvider<OAuth2LoginSuccessHandler> oauth2SuccessHandler,
      AuthProperties authProperties
  ) throws Exception {

    http
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        // Stateless JWT API: no CSRF tokens. The refresh cookie is protected by SameSite
        // plus the fact that its response (the access token) is unreadable cross-site.
        .csrf(csrf -> csrf.disable())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            // Auth + OAuth handshake endpoints
            .requestMatchers("/auth/**", "/oauth2/**", "/login/**", "/error").permitAll()
            // Public read access to listings
            .requestMatchers(HttpMethod.GET, "/buyListings/**", "/rentListings/**").permitAll()
            // Only agents/admins may create, edit, or remove listings.
            .requestMatchers(HttpMethod.POST, "/buyListings/**", "/rentListings/**").hasAnyRole("AGENT", "ADMIN")
            .requestMatchers(HttpMethod.PUT, "/buyListings/**", "/rentListings/**").hasAnyRole("AGENT", "ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/buyListings/**", "/rentListings/**").hasAnyRole("AGENT", "ADMIN")
            // Everything else (user data, favorites) requires a valid token
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
        // For API clients, respond 401 instead of redirecting to a login page.
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint(new HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)));

    // Only wire Google login if a client registration is actually configured.
    if (clientRegistrationRepository.getIfAvailable() != null) {
      OAuth2LoginSuccessHandler successHandler = oauth2SuccessHandler.getObject();
      String failureRedirect = authProperties.oauth2().frontendRedirectUri() + "?error=oauth";
      http.oauth2Login(login -> login
          .successHandler(successHandler)
          .failureHandler((req, res, ex) -> res.sendRedirect(failureRedirect)));
    }

    return http.build();
  }

  /**
   * Maps our JWT's {@code role} claim to a Spring authority, e.g. role "agent" -> ROLE_AGENT.
   */
  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter((Jwt jwt) -> {
      String role = jwt.getClaimAsString("role");
      if (role == null || role.isBlank()) return List.of();
      return List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
    });
    return converter;
  }
}
