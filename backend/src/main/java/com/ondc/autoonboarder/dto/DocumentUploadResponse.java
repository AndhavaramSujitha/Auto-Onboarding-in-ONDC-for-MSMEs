package com.ondc.autoonboarder.dto;

public record DocumentUploadResponse(
        String documentId,
        String status,
        String message) {}
