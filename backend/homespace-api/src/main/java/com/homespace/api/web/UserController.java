package com.homespace.api.web;

import com.homespace.api.domain.Listing;
import com.homespace.api.domain.User;
import com.homespace.api.repo.ListingRepository;
import com.homespace.api.repo.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

  private final UserRepository users;
  private final ListingRepository listings;

  @GetMapping
  public List<Map<String, Object>> findUsers(
      @RequestParam(required = false) String email,
      @RequestParam(required = false) String phone
  ) {
    if (email != null && !email.isBlank()) {
      return users.findByEmail(email)
          .map(u -> List.of(toUserLookupResponse(u)))
          .orElse(List.of());
    }

    if (phone != null && !phone.isBlank()) {
      return users.findByPhone(phone)
          .map(u -> List.of(toUserLookupResponse(u)))
          .orElse(List.of());
    }

    return users.findAll().stream()
        .map(this::toUserLookupResponse)
        .toList();
  }

  @PostMapping("/login")
public Map<String, Object> login(@RequestBody LoginBody body) {
  User user = users.findByEmail(body.getEmailOrPhone())
      .or(() -> users.findByPhone(body.getEmailOrPhone()))
      .orElseThrow(() -> new ResponseStatusException(
          HttpStatus.NOT_FOUND, "User not found"
      ));

  if (!user.getPassword().equals(body.getPassword())) {
    throw new ResponseStatusException(
        HttpStatus.UNAUTHORIZED, "Invalid credentials"
    );
  }

  return toUserResponse(user);
}

@Data
public static class LoginBody {
  private String emailOrPhone;
  private String password;
}

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Object> createUser(@RequestBody User u) {
    if (u.getEmail() == null || u.getEmail().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
    }
    if (u.getPassword() == null || u.getPassword().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
    }

    if (users.findByEmail(u.getEmail()).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
    }

    OffsetDateTime now = OffsetDateTime.now();
    if (u.getId() == null) u.setId(now.toInstant().toEpochMilli());
    u.setCreatedAt(now);
    u.setUpdatedAt(now);

    if (u.getFavorites() == null) {
      u.setFavorites(new HashSet<>());
    }

    User saved = users.save(u);
    return toUserResponse(saved);
  }

  @GetMapping("/{id}")
  public Map<String, Object> getUser(@PathVariable Long id) {
    User u = users.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return toUserResponse(u);
  }

  @PatchMapping("/{id}")
  public Map<String, Object> patchFavorites(@PathVariable("id") Long id, @RequestBody PatchBody body) {
    User u = users.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (body.getFavorites() != null) {
      Set<Long> ids = new HashSet<>();
      if (body.getFavorites().getBuy() != null) ids.addAll(body.getFavorites().getBuy());
      if (body.getFavorites().getRent() != null) ids.addAll(body.getFavorites().getRent());

      Set<Listing> favoriteListings = new HashSet<>(listings.findAllById(ids));
      u.setFavorites(favoriteListings);
    }

    u.setUpdatedAt(OffsetDateTime.now());
    User saved = users.save(u);
    return toUserResponse(saved);
  }

  @GetMapping("/{id}/favorites")
public List<Long> getFavorites(@PathVariable("id") Long id) {
  User u = users.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

  if (u.getFavorites() == null) {
    return List.of();
  }

  return u.getFavorites().stream()
      .map(Listing::getId)
      .sorted()
      .toList();
}

@PutMapping("/{id}/favorites")
public List<Long> updateFavorites(
    @PathVariable("id") Long id,
    @RequestBody Map<String, List<Long>> body
) {
  User u = users.findById(id)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

  List<Long> ids = body.getOrDefault("favorites", List.of());

  Set<Listing> favoriteListings = new HashSet<>(listings.findAllById(ids));
  u.setFavorites(favoriteListings);
  u.setUpdatedAt(OffsetDateTime.now());

  User saved = users.save(u);

  return saved.getFavorites().stream()
      .map(Listing::getId)
      .sorted()
      .toList();
}
  private Map<String, Object> toUserLookupResponse(User u) {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("id", u.getId());
    map.put("email", u.getEmail());
    map.put("phone", u.getPhone());
    map.put("firstName", u.getFirstName());
    map.put("lastName", u.getLastName());
    map.put("role", u.getRole());
    map.put("avatar", u.getAvatar());
    map.put("createdAt", u.getCreatedAt());

    // keeping password here only because your current frontend auth mock expects it
    // remove this once login is switched to POST /users/login
    map.put("password", u.getPassword());

    return map;
  }

  private Map<String, Object> toUserResponse(User u) {
  Set<Listing> favs = (u.getFavorites() == null) ? Set.of() : u.getFavorites();

  List<Long> buy = favs.stream()
      .filter(l -> "buy".equalsIgnoreCase(l.getListingType()))
      .map(Listing::getId)
      .sorted()
      .collect(Collectors.toList());

  List<Long> rent = favs.stream()
      .filter(l -> "rent".equalsIgnoreCase(l.getListingType()))
      .map(Listing::getId)
      .sorted()
      .collect(Collectors.toList());

  Map<String, Object> favorites = new LinkedHashMap<>();
  favorites.put("buy", buy);
  favorites.put("rent", rent);

  Map<String, Object> listingsMap = new LinkedHashMap<>();
  listingsMap.put("buy", List.of());
  listingsMap.put("rent", List.of());

  Map<String, Object> map = new LinkedHashMap<>();
  map.put("id", u.getId());
  map.put("email", u.getEmail());
  map.put("phone", u.getPhone());
  map.put("firstName", u.getFirstName());
  map.put("lastName", u.getLastName());
  map.put("role", u.getRole());
  map.put("avatar", u.getAvatar());
  map.put("favorites", favorites);
  map.put("listings", listingsMap);
  map.put("createdAt", u.getCreatedAt());
  map.put("updatedAt", u.getUpdatedAt());

  return map;
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