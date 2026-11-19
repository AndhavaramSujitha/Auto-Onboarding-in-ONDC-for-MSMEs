
package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.dto.ExtractionResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class GroqService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${groq.api.key:}")
private String apiKey;

    private static final String GROQ_URL =
            "https://api.groq.com/openai/v1/chat/completions";

    public GroqService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    // =====================================================
    // 1. EXISTING PAN AND GST DOCUMENT EXTRACTION
    // =====================================================

    public ExtractionResult extractBusinessInfo(
            String rawText,
            String documentType) {

        try {
            if (apiKey == null || apiKey.isBlank()) {
                throw new IllegalStateException(
                        "GROQ_API_KEY is missing."
                );
            }

            if (rawText == null || rawText.isBlank()) {
                throw new IllegalArgumentException(
                        "OCR text is empty."
                );
            }

            String systemPrompt = """
                You are an Indian PAN and GST document recognition
                and information extraction assistant.

                FIRST identify the actual document type using
                ONLY the OCR text.

                DOCUMENT TYPES:

                1. PAN_CARD:
                - Permanent Account Number
                - Income Tax Department
                - Government of India
                - PAN card identification indicators
                - PAN number matching pattern AAAAA9999A

                2. GST_CERTIFICATE:
                - Goods and Services Tax
                - GST Registration Certificate
                - GSTIN
                - Registration details
                - Certificate issued under GST law

                CLASSIFICATION RULES:

                - Never trust the seller-selected document type.
                - Identify the document using its actual contents.
                - A GST certificate can contain a PAN number.
                  Do not classify it as PAN_CARD merely because
                  a PAN number is present.
                - If GST registration certificate indicators
                  are present, classify it as GST_CERTIFICATE.
                - If PAN card indicators are present, classify
                  it as PAN_CARD.
                - If neither document can be identified confidently,
                  return UNKNOWN.
                - Do not guess.

                EXTRACTION RULES:

                - Extract only information present in OCR text.
                - Never invent missing information.
                - Return null for missing fields.
                - Do not extract unrelated fields as guesses.

                Return one valid JSON object:

                {
                  "documentType": "PAN_CARD, GST_CERTIFICATE or UNKNOWN",
                  "pan": null,
                  "gstin": null,
                  "ownerName": null,
                  "fatherName": null,
                  "dateOfBirth": null,
                  "businessName": null,
                  "tradeName": null,
                  "businessAddress": null,
                  "registrationDate": null,
                  "confidence": {
                    "pan": 0,
                    "gstin": 0,
                    "ownerName": 0,
                    "fatherName": 0,
                    "dateOfBirth": 0,
                    "businessName": 0,
                    "tradeName": 0,
                    "businessAddress": 0,
                    "registrationDate": 0
                  },
                  "requiresReview": true
                }

                Additional rules:
                - Confidence scores must be between 0 and 1.
                - Missing fields must have confidence 0.
                - Set requiresReview true if classification
                  or important extracted information is uncertain.
                - Return JSON only.
                """;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());

            Map<String, Object> payload = new HashMap<>();

            payload.put("model", "openai/gpt-oss-20b");
            payload.put("temperature", 0);
            payload.put("max_completion_tokens", 2000);
            payload.put(
                    "response_format",
                    Map.of("type", "json_object")
            );

            Map<String, String> systemMessage = Map.of(
                    "role", "system",
                    "content", systemPrompt
            );

            Map<String, String> userMessage = Map.of(
                    "role", "user",
                    "content", "OCR TEXT:\n" + rawText
            );

            payload.put(
                    "messages",
                    List.of(systemMessage, userMessage)
            );

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(payload, headers);

            String response = restTemplate.postForObject(
                    GROQ_URL,
                    request,
                    String.class
            );

            if (response == null || response.isBlank()) {
                throw new IllegalStateException(
                        "Empty Groq response."
                );
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode choices = root.path("choices");

            if (!choices.isArray() || choices.isEmpty()) {
                throw new IllegalStateException(
                        "Groq returned no choices."
                );
            }

            String content = choices.get(0)
                    .path("message")
                    .path("content")
                    .asText("");

            if (content.isBlank()) {
                throw new IllegalStateException(
                        "Groq returned empty content."
                );
            }

            JsonNode resultNode = objectMapper.readTree(content);

            if (!resultNode.isObject()) {
                throw new IllegalStateException(
                        "Groq did not return a JSON object."
                );
            }

            String detectedType = resultNode
                    .path("documentType")
                    .asText("");

            if (!detectedType.equals("PAN_CARD")
                    && !detectedType.equals("GST_CERTIFICATE")) {

                throw new IllegalStateException(
                        "Document type could not be identified."
                );
            }

            JsonNode confidenceNode = resultNode.path("confidence");

            String confidenceJson = confidenceNode.isObject()
                    ? confidenceNode.toString()
                    : "{}";

            boolean requiresReview =
                    resultNode.path("requiresReview").asBoolean(true);

            ObjectNode extractedFields =
                    ((ObjectNode) resultNode).deepCopy();

            extractedFields.remove("confidence");
            extractedFields.remove("requiresReview");

            boolean hasExtractedValue = false;

            var iterator = extractedFields.fields();

            while (iterator.hasNext()) {
                var entry = iterator.next();

                if (!entry.getKey().equals("documentType")
                        && !entry.getValue().isNull()
                        && !entry.getValue().asText("").isBlank()) {

                    hasExtractedValue = true;
                    break;
                }
            }

            if (!hasExtractedValue) {
                throw new IllegalStateException(
                        "No document information extracted by Groq."
                );
            }

            System.out.println(
                    "Actual document type detected: " + detectedType
            );

            return new ExtractionResult(
                    extractedFields.toString(),
                    confidenceJson,
                    requiresReview
            );

        } catch (Exception e) {
            System.err.println(
                    "Groq extraction failed: " + e.getMessage()
            );

            throw new IllegalStateException(
                    "Groq extraction failed: " + e.getMessage(),
                    e
            );
        }
    }

    // =====================================================
    // 2. NEW AI PRODUCT CATALOG GENERATOR
    // Description is required. Image is optional.
    // =====================================================

    public String generateProductCatalog(
            String description,
            MultipartFile imageFile) {

        try {
            if (apiKey == null || apiKey.isBlank()) {
                throw new IllegalStateException(
                        "GROQ_API_KEY is missing."
                );
            }

            if (description == null || description.isBlank()) {
                throw new IllegalArgumentException(
                        "Product description is required."
                );
            }

            if (imageFile != null && !imageFile.isEmpty()) {

                if (imageFile.getSize() > 8 * 1024 * 1024) {
                    throw new IllegalArgumentException(
                            "Image size must be below 8MB."
                    );
                }

                String contentType = imageFile.getContentType();

                if (contentType == null ||
                        !(contentType.equalsIgnoreCase("image/jpeg")
                        || contentType.equalsIgnoreCase("image/jpg")
                        || contentType.equalsIgnoreCase("image/png"))) {

                    throw new IllegalArgumentException(
                            "Only JPG, JPEG and PNG images are supported."
                    );
                }
            }

            String systemPrompt = """
                You are an expert e-commerce product catalog assistant
                helping Indian MSMEs create professional ONDC product
                catalog listings.

                Your task is to generate accurate product information
                using the seller's description and optional image.

                RULES:

                1. Generate a clear and professional product name.
                2. Generate a useful product description.
                3. Suggest an appropriate product category.
                4. Suggest a subcategory when possible.
                5. Extract the brand only when supported by the input.
                6. Identify the unit only when supported by the input.
                7. Include relevant product characteristics in attributes.
                8. Use the image as supporting evidence when provided.
                9. Never invent product specifications, brand, material,
                   certifications, ingredients or origin.
                10. If a value is unavailable, return null.
                11. Do not generate product price.
                12. Do not generate stock quantity.
                13. Do not generate SKU.
                14. Do not invent compliance claims.
                15. The seller must review the generated information.
                16. Return valid JSON only.

                Return this JSON structure:

                {
                  "productName": "",
                  "description": "",
                  "category": "",
                  "subcategory": null,
                  "brand": null,
                  "unit": null,
                  "attributes": {},
                  "requiresReview": true
                }
                """;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());

            Map<String, Object> payload = new HashMap<>();

            payload.put("model", "qwen/qwen3.8-27b");
            payload.put("temperature", 0);
            payload.put("max_completion_tokens", 1500);
            payload.put(
                    "response_format",
                    Map.of("type", "json_object")
            );

            Map<String, Object> systemMessage = Map.of(
                    "role", "system",
                    "content", systemPrompt
            );

            List<Map<String, Object>> content = new ArrayList<>();

            content.add(Map.of(
                    "type", "text",
                    "text", "Seller product description:\n" + description
            ));

            // Attach image only when seller uploads one.
            if (imageFile != null && !imageFile.isEmpty()) {

                String mimeType = imageFile.getContentType();

                if ("image/jpg".equalsIgnoreCase(mimeType)) {
                    mimeType = "image/jpeg";
                }

                String base64 = Base64.getEncoder()
                        .encodeToString(imageFile.getBytes());

                content.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of(
                                "url", "data:" + mimeType + ";base64," + base64
                        )
                ));
            }

            Map<String, Object> userMessage = Map.of(
                    "role", "user",
                    "content", content
            );

            payload.put(
                    "messages",
                    List.of(systemMessage, userMessage)
            );

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(payload, headers);

            String response = restTemplate.postForObject(
                    GROQ_URL,
                    request,
                    String.class
            );

            if (response == null || response.isBlank()) {
                throw new IllegalStateException(
                        "Groq returned an empty response."
                );
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode choices = root.path("choices");

            if (!choices.isArray() || choices.isEmpty()) {
                throw new IllegalStateException(
                        "Groq returned no response choices."
                );
            }

            String result = choices.get(0)
                    .path("message")
                    .path("content")
                    .asText("");

            if (result.isBlank()) {
                throw new IllegalStateException(
                        "AI generated an empty catalog response."
                );
            }

            JsonNode resultNode = objectMapper.readTree(result);

            if (!resultNode.isObject()
                    || resultNode.path("productName").asText("").isBlank()
                    || resultNode.path("description").asText("").isBlank()
                    || resultNode.path("category").asText("").isBlank()) {

                throw new IllegalStateException(
                        "AI response is missing required product details."
                );
            }

            // Always require seller review.
            ((ObjectNode) resultNode).put("requiresReview", true);

            // Price, quantity and SKU must never come from AI.
            ((ObjectNode) resultNode).remove("price");
            ((ObjectNode) resultNode).remove("availableQuantity");
            ((ObjectNode) resultNode).remove("sku");

            return resultNode.toString();

        } catch (Exception e) {

            System.err.println(
                    "AI catalog generation failed: " + e.getMessage()
            );

            throw new IllegalStateException(
                    "AI catalog generation failed: " + e.getMessage(),
                    e
            );
        }
    }

    // =====================================================
    // 3. EXISTING PRODUCT IMAGE EXTRACTION
    // Kept for the existing image-analysis workflow.
    // =====================================================

    public ExtractionResult extractProductInfoFromImage(File imageFile) {

        try {
            byte[] bytes = Files.readAllBytes(imageFile.toPath());
            String base64 = Base64.getEncoder().encodeToString(bytes);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey.trim());

            String systemPrompt =
                    "Extract structured product information from the image. " +
                    "Return JSON fields: productName, description, category, " +
                    "subcategory, brand, color, material, attributes. " +
                    "Also include a confidence map with scores from 0 to 1 " +
                    "and a boolean requiresReview.";

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", "qwen/qwen3.8-27b");
            payload.put("temperature", 0);
            payload.put(
                    "response_format",
                    Map.of("type", "json_object")
            );

            List<Map<String, Object>> content = new ArrayList<>();

            content.add(Map.of(
                    "type", "text",
                    "text", systemPrompt
            ));

            content.add(Map.of(
                    "type", "image_url",
                    "image_url", Map.of(
                            "url", "data:image/jpeg;base64," + base64
                    )
            ));

            Map<String, Object> userMessage = Map.of(
                    "role", "user",
                    "content", content
            );

            payload.put("messages", List.of(userMessage));

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(payload, headers);

            String response = restTemplate.postForObject(
                    GROQ_URL,
                    request,
                    String.class
            );

            if (response == null || response.isBlank()) {
                throw new IllegalStateException("Empty Groq response.");
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode choices = root.path("choices");

            if (!choices.isArray() || choices.isEmpty()) {
                throw new IllegalStateException("Groq returned no choices.");
            }

            String result = choices.get(0)
                    .path("message")
                    .path("content")
                    .asText("");

            JsonNode resultNode = objectMapper.readTree(result);

            String json = resultNode.toString();

            JsonNode confidenceNode = resultNode.path("confidence");

            String confidenceJson = confidenceNode.isMissingNode()
                    ? "{}"
                    : confidenceNode.toString();

            boolean requiresReview =
                    resultNode.path("requiresReview").asBoolean(true);

            return new ExtractionResult(
                    json,
                    confidenceJson,
                    requiresReview
            );

        } catch (Exception e) {

            System.err.println(
                    "Product extraction failed: " + e.getMessage()
            );

            return new ExtractionResult("{}", "{}", true);
        }
    }
}
