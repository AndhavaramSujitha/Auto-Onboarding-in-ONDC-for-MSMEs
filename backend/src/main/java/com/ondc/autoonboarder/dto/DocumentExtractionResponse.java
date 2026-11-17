
package com.ondc.autoonboarder.dto;

public record DocumentExtractionResponse(
        String documentId,
        String type,
        String status,
        String extractedJson,
        String confidenceJson,
        Boolean requiresReview,
        String message
) {}
