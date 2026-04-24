package com.homespace.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class User {

  @Id
  private Long id; // seeded ids; switch to @GeneratedValue if you stop seeding

  @Column(name="email", nullable=false, unique=true) private String email;
  @Column(name="phone") private String phone;
  @Column(name="first_name") private String firstName;
  @Column(name="last_name")  private String lastName;

  @JsonIgnore
  @Column(name="password", nullable=false) private String password;

  @Column(name="role")   private String role;
  @Column(name="avatar") private String avatar;

  @Column(name="created_at") private OffsetDateTime createdAt;
  @Column(name="updated_at") private OffsetDateTime updatedAt;

  @ManyToMany
  @JoinTable(
  name = "user_favorites",
  joinColumns = @JoinColumn(name = "user_id"),
  inverseJoinColumns = @JoinColumn(name = "listing_id")
)
private Set<Listing> favorites = new HashSet<>();
}
