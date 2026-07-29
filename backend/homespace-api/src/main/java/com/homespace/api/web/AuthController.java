package com.homespace.api.web;

import com.homespace.api.domain.User;
import com.homespace.api.repo.UserRepository;
import com.homespace.api.security.CookieUtil;
import com.homespace.api.security.CurrentUserService;
import com.homespace.api.security.JwtService;
import com.homespace.api.security.RefreshTokenService;
import com.homespace.api.web.dto.AuthDtos.LoginRequest;
import com.homespace.api.web.dto.AuthDtos.RegisterRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Local (email/password) authentication plus token refresh/logout. Issues our own signed
 * access token in the JSON body and a rotating refresh token in an httpOnly cookie.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final RefreshTokenService refreshTokens;
  private final CookieUtil cookieUtil;
  private final CurrentUserService currentUser;
  private final UserMapper userMapper;

  public AuthController(UserRepository users, PasswordEncoder passwordEncoder,
                        JwtService jwtService, RefreshTokenService refreshTokens,
                        CookieUtil cookieUtil, CurrentUserService currentUser,
                        UserMapper userMapper) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.refreshTokens = refreshTokens;
    this.cookieUtil = cookieUtil;
    this.currentUser = currentUser;
    this.userMapper = userMapper;
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
    if (users.findByEmail(req.email()).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
    }

    OffsetDateTime now = OffsetDateTime.now();
    User u = new User();
    u.setId(now.toInstant().toEpochMilli());
    u.setEmail(req.email());
    u.setPhone(req.phone());
    u.setFirstName(req.firstName());
    u.setLastName(req.lastName());
    u.setPassword(passwordEncoder.encode(req.password()));
    // Self-service accounts may register as a listing "agent"; everything else defaults
    // to "user". Elevated roles (e.g. admin) are never self-assignable here.
    u.setRole("agent".equalsIgnoreCase(req.role()) ? "agent" : "user");
    u.setAuthProvider("LOCAL");
    u.setFavorites(new HashSet<>());
    u.setCreatedAt(now);
    u.setUpdatedAt(now);

    User saved = users.save(u);
    return issueTokens(saved, HttpStatus.CREATED);
  }

  @PostMapping("/login")
  public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
    User user = users.findByEmail(req.emailOrPhone())
        .or(() -> users.findByPhone(req.emailOrPhone()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

    if (user.getPassword() == null || user.getPassword().isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
          "This account uses Google sign-in");
    }
    if (!passwordEncoder.matches(req.password(), user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    return issueTokens(user, HttpStatus.OK);
  }

  @PostMapping("/refresh")
  public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest request) {
    String raw = cookieUtil.read(request)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No refresh token"));

    RefreshTokenService.RotationResult result;
    try {
      result = refreshTokens.rotate(raw);
    } catch (RefreshTokenService.InvalidRefreshTokenException e) {
      // Clear the bad cookie so the client stops retrying with it.
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .header(HttpHeaders.SET_COOKIE, cookieUtil.expired().toString())
          .body(Map.of("error", "invalid_refresh_token"));
    }

    User user = users.findById(result.userId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));

    String accessToken = jwtService.generateAccessToken(user);
    ResponseCookie cookie = cookieUtil.build(result.token().rawValue(), result.token().ttlSeconds());
    return ResponseEntity.ok()
        .header(HttpHeaders.SET_COOKIE, cookie.toString())
        .body(authBody(accessToken, user));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout(HttpServletRequest request) {
    cookieUtil.read(request).ifPresent(refreshTokens::revoke);
    return ResponseEntity.noContent()
        .header(HttpHeaders.SET_COOKIE, cookieUtil.expired().toString())
        .build();
  }

  @GetMapping("/me")
  public Map<String, Object> me() {
    return userMapper.toResponse(currentUser.requireUser());
  }

  // --- helpers ---

  private ResponseEntity<Map<String, Object>> issueTokens(User user, HttpStatus status) {
    String accessToken = jwtService.generateAccessToken(user);
    RefreshTokenService.IssuedToken refresh = refreshTokens.issue(user.getId());
    ResponseCookie cookie = cookieUtil.build(refresh.rawValue(), refresh.ttlSeconds());

    return ResponseEntity.status(status)
        .header(HttpHeaders.SET_COOKIE, cookie.toString())
        .body(authBody(accessToken, user));
  }

  private Map<String, Object> authBody(String accessToken, User user) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("accessToken", accessToken);
    body.put("tokenType", "Bearer");
    body.put("expiresIn", jwtService.getAccessTtlSeconds());
    body.put("user", userMapper.toResponse(user));
    return body;
  }
}
