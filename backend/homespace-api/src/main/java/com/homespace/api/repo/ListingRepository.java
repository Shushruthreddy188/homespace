package com.homespace.api.repo;

import com.homespace.api.domain.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long> {
  List<Listing> findByListingType(String listingType);
}
