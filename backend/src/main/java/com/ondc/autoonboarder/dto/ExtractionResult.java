package com.ondc.autoonboarder.dto;

public record ExtractionResult(String json, String confidenceJson, Boolean requiresReview) {}
