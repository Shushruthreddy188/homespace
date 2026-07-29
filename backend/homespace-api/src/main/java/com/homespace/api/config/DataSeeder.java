package com.homespace.api.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.homespace.api.domain.Listing;
import com.homespace.api.domain.User;
import com.homespace.api.repo.ListingRepository;
import com.homespace.api.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * On first boot (empty DB), loads listings and demo users from {@code seed-data.json}
 * so the app is usable locally. Seeded passwords are BCrypt-hashed on insert — the raw
 * values in the seed file are never stored.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

  private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

  private final ListingRepository listings;
  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final ObjectMapper mapper = new ObjectMapper();

  public DataSeeder(ListingRepository listings, UserRepository users, PasswordEncoder passwordEncoder) {
    this.listings = listings;
    this.users = users;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(String... args) throws Exception {
    if (listings.count() > 0 || users.count() > 0) {
      log.info("Seed skipped: database already contains data");
      return;
    }

    ClassPathResource resource = new ClassPathResource("seed-data.json");
    if (!resource.exists()) {
      log.warn("Seed skipped: seed-data.json not found on classpath");
      return;
    }

    JsonNode root;
    try (InputStream in = resource.getInputStream()) {
      root = mapper.readTree(in);
    }

    OffsetDateTime now = OffsetDateTime.now();
    Map<Long, Listing> byId = new HashMap<>();

    int listingCount = 0;
    listingCount += seedListings(root.get("buyListings"), "buy", now, byId);
    listingCount += seedListings(root.get("rentListings"), "rent", now, byId);

    int userCount = seedUsers(root.get("users"), now, byId);

    log.info("Seeded {} listings and {} users from seed-data.json", listingCount, userCount);
  }

  private int seedListings(JsonNode arr, String type, OffsetDateTime now, Map<Long, Listing> byId) {
    if (arr == null || !arr.isArray()) return 0;
    List<Listing> batch = new ArrayList<>();
    for (JsonNode n : arr) {
      Listing l = new Listing();
      l.setId(n.path("id").asLong());
      l.setName(n.path("name").asText(null));
      l.setAddress(n.path("address").asText(null));
      l.setDescription(n.path("description").asText(null));
      l.setImage(n.path("image").asText(null));
      l.setListingType(type);
      l.setMinPrice(intOrNull(n, "minPrice"));
      l.setMaxPrice(intOrNull(n, "maxPrice"));
      l.setMinBeds(intOrNull(n, "minBeds"));
      l.setMaxBeds(intOrNull(n, "maxBeds"));
      l.setLat(n.has("lat") && !n.get("lat").isNull() ? n.get("lat").asDouble() : null);
      l.setLon(n.has("lon") && !n.get("lon").isNull() ? n.get("lon").asDouble() : null);
      l.setCreatedAt(now);
      l.setUpdatedAt(now);
      batch.add(l);
      byId.put(l.getId(), l);
    }
    listings.saveAll(batch);
    return batch.size();
  }

  private int seedUsers(JsonNode arr, OffsetDateTime now, Map<Long, Listing> byId) {
    if (arr == null || !arr.isArray()) return 0;
    List<User> batch = new ArrayList<>();
    for (JsonNode n : arr) {
      User u = new User();
      u.setId(n.path("id").asLong());
      u.setEmail(n.path("email").asText(null));
      u.setPhone(n.path("phone").asText(null));
      u.setFirstName(n.path("firstName").asText(null));
      u.setLastName(n.path("lastName").asText(null));

      String rawPassword = n.path("password").asText(null);
      if (rawPassword != null && !rawPassword.isBlank()) {
        u.setPassword(passwordEncoder.encode(rawPassword));
      }
      u.setAuthProvider("LOCAL");
      u.setRole(n.path("role").asText("user"));
      u.setAvatar(n.path("avatar").asText(null));
      u.setCreatedAt(now);
      u.setUpdatedAt(now);

      // Link favorites (buy + rent ids) to the seeded Listing entities.
      Set<Listing> favorites = new HashSet<>();
      collectFavorites(n.path("favorites").path("buy"), byId, favorites);
      collectFavorites(n.path("favorites").path("rent"), byId, favorites);
      u.setFavorites(favorites);

      batch.add(u);
    }
    users.saveAll(batch);
    return batch.size();
  }

  private void collectFavorites(JsonNode ids, Map<Long, Listing> byId, Set<Listing> into) {
    if (ids == null || !ids.isArray()) return;
    for (JsonNode idNode : ids) {
      Listing l = byId.get(idNode.asLong());
      if (l != null) into.add(l);
    }
  }

  private Integer intOrNull(JsonNode n, String field) {
    JsonNode v = n.get(field);
    return (v == null || v.isNull()) ? null : v.asInt();
  }
}
