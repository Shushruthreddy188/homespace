package com.homespace.api.web;

import com.homespace.api.domain.Listing;
import com.homespace.api.domain.User;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds the JSON shape the frontend expects for a user. Never includes the password.
 */
@Component
public class UserMapper {

  public Map<String, Object> toResponse(User u) {
    Set<Listing> favs = (u.getFavorites() == null) ? Set.of() : u.getFavorites();

    List<Long> buy = favs.stream()
        .filter(l -> "buy".equalsIgnoreCase(l.getListingType()))
        .map(Listing::getId).sorted().collect(Collectors.toList());

    List<Long> rent = favs.stream()
        .filter(l -> "rent".equalsIgnoreCase(l.getListingType()))
        .map(Listing::getId).sorted().collect(Collectors.toList());

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

  /** A lookup response for the /users search endpoint — no favorites, and never a password. */
  public Map<String, Object> toLookupResponse(User u) {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("id", u.getId());
    map.put("email", u.getEmail());
    map.put("phone", u.getPhone());
    map.put("firstName", u.getFirstName());
    map.put("lastName", u.getLastName());
    map.put("role", u.getRole());
    map.put("avatar", u.getAvatar());
    map.put("createdAt", u.getCreatedAt());
    return map;
  }
}
