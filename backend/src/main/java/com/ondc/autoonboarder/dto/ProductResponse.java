package com.ondc.autoonboarder.dto;

public record ProductResponse(
        String id,
        String businessId,
        String productName,
        String description,
        String category,
        String subcategory,
        String brand,
        String sku,
        double price,
        String currency,
        int availableQuantity,
        String unit,
        java.util.List<String> images,
        java.util.Map<String, Object> attributes,
        String status,
        String complianceStatus,
        java.time.Instant createdAt,
        java.time.Instant updatedAt) {}
