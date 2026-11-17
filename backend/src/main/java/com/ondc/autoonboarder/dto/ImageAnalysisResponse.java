package com.ondc.autoonboarder.dto;

public record ImageAnalysisResponse(
        String imageId,
        String status,
        String extractedInfoJson,
        String confidenceJson,
        Boolean requiresReview,
        String message) {}
