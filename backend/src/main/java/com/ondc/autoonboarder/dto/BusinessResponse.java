package com.ondc.autoonboarder.dto;

public record BusinessResponse(
        String id,
        String ownerId,
        String businessName,
        String ownerName,
        String businessEmail,
        String contactNumber,
        String address,
        String state,
        String district,
        String pinCode,
        String businessCategory,
        String gstin,
        String pan,
        String udyamRegistration,
        String businessType,
        java.util.List<String> preferredSellingCategories,
        java.time.Instant createdAt,
        java.time.Instant updatedAt
) {}
