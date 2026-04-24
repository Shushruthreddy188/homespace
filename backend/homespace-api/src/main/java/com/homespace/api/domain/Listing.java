package com.homespace.api.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "listings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Listing {

  @Id
  private Long id;

  @Column(name="name", nullable=false)    private String name;
  @Column(name="address", nullable=false) private String address;

  @Column(name="description", columnDefinition="text") private String description;
  @Column(name="image") private String image;

  @Column(name="listing_type", nullable=false) private String listingType; // 'buy' or 'rent'

  @Column(name="min_price") private Integer minPrice;
  @Column(name="max_price") private Integer maxPrice;
  @Column(name="min_beds")  private Integer minBeds;
  @Column(name="max_beds")  private Integer maxBeds;

  @Column(name="lat") private Double lat;
  @Column(name="lon") private Double lon;

@ManyToOne
@JoinColumn(name = "owner_id")
@JsonIgnore
private User owner;

  @Column(name="created_at") private OffsetDateTime createdAt;
  @Column(name="updated_at") private OffsetDateTime updatedAt;

  public Long getOwnerId() {
  return owner != null ? owner.getId() : null;
}
}
