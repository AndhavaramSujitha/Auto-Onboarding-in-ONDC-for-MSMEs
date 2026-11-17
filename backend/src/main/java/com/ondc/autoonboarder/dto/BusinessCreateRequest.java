package com.ondc.autoonboarder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record BusinessCreateRequest(
        @NotBlank String businessName,
        @NotBlank String ownerName,
        @Email String businessEmail,
        @NotBlank String contactNumber,
        @NotBlank String address,
        @NotBlank String state,
        @NotBlank String district,
        @Pattern(regexp = "\\d{6}", message = "PIN code must be 6 digits") String pinCode,
        @NotBlank String businessCategory,
        String gstin,
        String pan,
        String udyamRegistration,
        @NotBlank String businessType,
        java.util.List<String> preferredSellingCategories
) {}
