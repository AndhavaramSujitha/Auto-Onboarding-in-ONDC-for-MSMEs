package com.ondc.autoonboarder.dto;

public record OndcConfigRequest(
        String endpointUrl,
        String apiKey,
        String apiSecret) {}
