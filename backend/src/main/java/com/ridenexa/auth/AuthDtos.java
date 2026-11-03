package com.ridenexa.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}
    public record CustomerRegistration(@NotBlank @Size(max = 120) String fullName, @Email @NotBlank String email, @NotBlank @Size(min = 8, max = 100) String password, @NotBlank String phone, @NotBlank String city, Double latitude, Double longitude) {}
    public record OwnerRegistration(@NotBlank @Size(max = 120) String fullName, @Email @NotBlank String email, @NotBlank @Size(min = 8, max = 100) String password, @NotBlank String phone, @NotBlank String city, @NotBlank String businessName, @NotBlank String businessPhone, String gstNumber, @NotBlank String addressLine, Integer serviceRadiusKm, Double latitude, Double longitude, String vehicleTypes) {}
    public record StaffRegistration(@NotBlank @Size(max = 120) String fullName, @Email @NotBlank String email, @NotBlank @Size(min = 8, max = 100) String password, @NotBlank String phone, @NotBlank String city, String licenceNumber) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record UpdateProfileRequest(@NotBlank @Size(max = 120) String fullName, @NotBlank String phone, @NotBlank String city, String profileImage) {}
    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min = 6, max = 100) String newPassword) {}
}
