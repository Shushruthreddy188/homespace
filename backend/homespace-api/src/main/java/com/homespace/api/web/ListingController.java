package com.homespace.api.web;

import com.homespace.api.domain.Listing;
import com.homespace.api.repo.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ListingController {

  private final ListingRepository listings;

  @GetMapping("/buyListings")
  public List<Listing> buy() {
    return listings.findByListingType("buy");
  }

  @GetMapping("/rentListings")
  public List<Listing> rent() {
    return listings.findByListingType("rent");
  }

  @GetMapping("/buyListings/{id}")
  public Listing getBuy(@PathVariable("id") Long id) {
    Listing l = listings.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
    if (!"buy".equalsIgnoreCase(l.getListingType())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Buy listing not found");
    }
    return l;
  }

  @GetMapping("/rentListings/{id}")
  public Listing getRent(@PathVariable("id") Long id) {
    Listing l = listings.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
    if (!"rent".equalsIgnoreCase(l.getListingType())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rent listing not found");
    }
    return l;
  }

  @PostMapping("/buyListings")
  @ResponseStatus(HttpStatus.CREATED)
  public Listing createBuy(@RequestBody Listing l) {
    OffsetDateTime now = OffsetDateTime.now();
    if (l.getId() == null) l.setId(now.toInstant().toEpochMilli());
    l.setListingType("buy");
    l.setCreatedAt(now);
    l.setUpdatedAt(now);
    return listings.save(l);
  }

  @PostMapping("/rentListings")
  @ResponseStatus(HttpStatus.CREATED)
  public Listing createRent(@RequestBody Listing l) {
    OffsetDateTime now = OffsetDateTime.now();
    if (l.getId() == null) l.setId(now.toInstant().toEpochMilli());
    l.setListingType("rent");
    l.setCreatedAt(now);
    l.setUpdatedAt(now);
    return listings.save(l);
  }

  @PutMapping("/buyListings/{id}")
  public Listing updateBuy(@PathVariable("id") Long id, @RequestBody Listing incoming) {
    return updateListing(id, incoming, "buy");
  }

  @PutMapping("/rentListings/{id}")
  public Listing updateRent(@PathVariable("id") Long id, @RequestBody Listing incoming) {
    return updateListing(id, incoming, "rent");
  }

  @DeleteMapping("/buyListings/{id}")
  public void deleteBuy(@PathVariable("id") Long id) {
    deleteListing(id, "buy");
  }

  @DeleteMapping("/rentListings/{id}")
  public void deleteRent(@PathVariable("id") Long id) {
    deleteListing(id, "rent");
  }

  private Listing updateListing(Long id, Listing incoming, String expectedType) {
    Listing existing = listings.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

    if (!expectedType.equalsIgnoreCase(existing.getListingType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing type mismatch");
    }

    existing.setName(incoming.getName());
    existing.setAddress(incoming.getAddress());
    existing.setDescription(incoming.getDescription());
    existing.setImage(incoming.getImage());
    existing.setMinPrice(incoming.getMinPrice());
    existing.setMaxPrice(incoming.getMaxPrice());
    existing.setMinBeds(incoming.getMinBeds());
    existing.setMaxBeds(incoming.getMaxBeds());
    existing.setLat(incoming.getLat());
    existing.setLon(incoming.getLon());
    existing.setOwner(incoming.getOwner());
    existing.setUpdatedAt(OffsetDateTime.now());

    return listings.save(existing);
  }

  private void deleteListing(Long id, String expectedType) {
    Listing existing = listings.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));

    if (!expectedType.equalsIgnoreCase(existing.getListingType())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing type mismatch");
    }

    listings.delete(existing);
  }
}