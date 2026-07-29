package com.homespace.api.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request bodies for the auth endpoints.
 */
public final class AuthDtos {

  private AuthDtos() {}

  public record RegisterRequest(
      @NotBlank String firstName,
      String lastName,
      @NotBlank @Email String email,
      String phone,
      @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password,
      String role
  ) {}

  public record LoginRequest(
      @NotBlank String emailOrPhone,
      @NotBlank String password
  ) {}
}
