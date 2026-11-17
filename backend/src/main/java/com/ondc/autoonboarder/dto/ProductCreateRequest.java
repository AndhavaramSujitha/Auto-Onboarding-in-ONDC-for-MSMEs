package com.ondc.autoonboarder.dto;

public record ProductCreateRequest(
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
        java.util.Map<String, Object> attributes
) {}
