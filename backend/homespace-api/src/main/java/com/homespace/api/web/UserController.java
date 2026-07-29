package com.homespace.api.web;

import com.homespace.api.domain.Listing;
import com.homespace.api.domain.User;
import com.homespace.api.repo.ListingRepository;
import com.homespace.api.repo.UserRepository;
import com.homespace.api.security.CurrentUserService;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/users")
public class UserController {

  private final UserRepository users;
  private final ListingRepository listings;
  private final CurrentUserService currentUser;
  private final UserMapper userMapper;

  public UserController(UserRepository users, ListingRepository listings,
                        CurrentUserService currentUser, UserMapper userMapper) {
    this.users = users;
    this.listings = listings;
    this.currentUser = currentUser;
    this.userMapper = userMapper;
  }

  @GetMapping
  public List<Map<String, Object>> findUsers(
      @RequestParam(required = false) String email,
      @RequestParam(required = false) String phone
  ) {
    if (email != null && !email.isBlank()) {
      return users.findByEmail(email)
          .map(u -> List.of(userMapper.toLookupResponse(u)))
          .orElse(List.of());
    }
    if (phone != null && !phone.isBlank()) {
      return users.findByPhone(phone)
          .map(u -> List.of(userMapper.toLookupResponse(u)))
          .orElse(List.of());
    }
    return users.findAll().stream()
        .map(userMapper::toLookupResponse)
        .toList();
  }

  @GetMapping("/{id}")
  public Map<String, Object> getUser(@PathVariable Long id) {
    User u = users.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    // Full self-view (with favorites) for the owner; contact-only view for others.
    return id.equals(currentUser.requireUserId())
        ? userMapper.toResponse(u)
        : userMapper.toLookupResponse(u);
  }

  @PatchMapping("/{id}")
  public Map<String, Object> patchFavorites(@PathVariable("id") Long id, @RequestBody PatchBody body) {
    User u = requireSelf(id);

    if (body.getFavorites() != null) {
      Set<Long> ids = new HashSet<>();
      if (body.getFavorites().getBuy() != null) ids.addAll(body.getFavorites().getBuy());
      if (body.getFavorites().getRent() != null) ids.addAll(body.getFavorites().getRent());

      Set<Listing> favoriteListings = new HashSet<>(listings.findAllById(ids));
      u.setFavorites(favoriteListings);
    }

    u.setUpdatedAt(OffsetDateTime.now());
    User saved = users.save(u);
    return userMapper.toResponse(saved);
  }

  @GetMapping("/{id}/favorites")
  public List<Long> getFavorites(@PathVariable("id") Long id) {
    User u = requireSelf(id);
    if (u.getFavorites() == null) return List.of();
    return u.getFavorites().stream().map(Listing::getId).sorted().toList();
  }

  @PutMapping("/{id}/favorites")
  public List<Long> updateFavorites(
      @PathVariable("id") Long id,
      @RequestBody Map<String, List<Long>> body
  ) {
    User u = requireSelf(id);
    List<Long> ids = body.getOrDefault("favorites", List.of());

    Set<Listing> favoriteListings = new HashSet<>(listings.findAllById(ids));
    u.setFavorites(favoriteListings);
    u.setUpdatedAt(OffsetDateTime.now());

    User saved = users.save(u);
    return saved.getFavorites().stream().map(Listing::getId).sorted().toList();
  }

  /**
   * Loads the target user, but only if it is the caller's own account. Prevents one
   * authenticated user from reading or mutating another user's data by guessing ids.
   */
  private User requireSelf(Long id) {
    if (!id.equals(currentUser.requireUserId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only access your own account");
    }
    return users.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
  }

  @Data
  public static class PatchBody {
    private Favorites favorites;
    private String updatedAt;
  }

  @Data
  public static class Favorites {
    private List<Long> buy;
    private List<Long> rent;
  }
}
