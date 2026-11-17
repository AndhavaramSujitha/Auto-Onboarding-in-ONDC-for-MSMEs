
package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.model.Business;
import com.ondc.autoonboarder.model.BusinessDocument;
import com.ondc.autoonboarder.repository.BusinessDocumentRepository;
import com.ondc.autoonboarder.repository.BusinessRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class DocumentProcessingService {

    @Autowired
    private BusinessDocumentRepository documentRepository;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private OcrService ocrService;

    @Autowired
    private GroqService groqService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Async("documentTaskExecutor")
    public void processDocumentAsync(
            String documentId,
            String businessId) {

        BusinessDocument doc = documentRepository
                .findByIdAndBusinessId(documentId, businessId)
                .orElse(null);

        if (doc == null) {
            System.err.println("Document not found: " + documentId);
            return;
        }

        String currentStage = "INITIALIZATION";

        try {
            // STEP 1: UPDATE STATUS
            doc.setStatus("PROCESSING");
            doc.setMessage(null);
            documentRepository.save(doc);

            // STEP 2: VALIDATE SELECTED DOCUMENT TYPE
            currentStage = "DOCUMENT TYPE VALIDATION";

            String selectedType = doc.getSelectedType();

            if (selectedType == null || selectedType.isBlank()) {
                throw new IllegalArgumentException(
                        "Selected document category is missing."
                );
            }

            selectedType = selectedType.trim().toUpperCase();

            if (!selectedType.equals("PAN_CARD")
                    && !selectedType.equals("GST_CERTIFICATE")) {
                throw new IllegalArgumentException(
                        "Unsupported document category: " + selectedType
                );
            }

            // STEP 3: CHECK FILE
            currentStage = "FILE VALIDATION";

            String storedPath = doc.getStoredPath();

            if (storedPath == null || storedPath.isBlank()) {
                throw new IllegalStateException(
                        "Document file path is missing."
                );
            }

            File file = new File(storedPath);

            if (!file.exists() || !file.isFile()) {
                throw new IllegalStateException(
                        "Uploaded document file not found: " + storedPath
                );
            }

            System.out.println("========== DOCUMENT PROCESSING ==========");
            System.out.println("Document ID: " + documentId);
            System.out.println("Selected Type: " + selectedType);
            System.out.println("File: " + file.getAbsolutePath());

            // STEP 4: OCR EXTRACTION
            currentStage = "OCR EXTRACTION";

            System.out.println("========== OCR START ==========");

            String rawText = ocrService.extractText(file);

            if (rawText == null || rawText.isBlank()) {
                throw new IllegalStateException(
                        "OCR did not extract readable text. Check the file and Tesseract configuration."
                );
            }

            System.out.println(
                    "OCR successful. Character count: " + rawText.length()
            );

            // STEP 5: GROQ EXTRACTION
            currentStage = "GROQ EXTRACTION";

            System.out.println("========== GROQ START ==========");

            var result = groqService.extractBusinessInfo(
                    rawText,
                    selectedType
            );

            if (result == null
                    || result.json() == null
                    || result.json().isBlank()
                    || result.json().trim().equals("{}")) {

                throw new IllegalStateException(
                        "Groq returned empty extracted information."
                );
            }

            // STEP 6: PARSE JSON
            currentStage = "JSON PARSING";

            JsonNode extractedData = objectMapper.readTree(result.json());

            if (extractedData == null || !extractedData.isObject()) {
                throw new IllegalStateException(
                        "Groq returned an invalid JSON response."
                );
            }

            String detectedType = extractedData
                    .path("documentType")
                    .asText("")
                    .trim()
                    .toUpperCase();

            if (!detectedType.equals("PAN_CARD")
                    && !detectedType.equals("GST_CERTIFICATE")) {

                throw new IllegalStateException(
                        "Document type could not be identified."
                );
            }

            // STEP 7: VALIDATE DOCUMENT TYPE
            currentStage = "DOCUMENT TYPE VERIFICATION";

            if (!selectedType.equals(detectedType)) {
                throw new IllegalStateException(
                        "Wrong document uploaded. Selected: "
                                + selectedType
                                + ", Detected: "
                                + detectedType
                );
            }

            // STEP 8: EXTRACT PAN / GSTIN
            currentStage = "BUSINESS INFORMATION EXTRACTION";

            String extractedValue;

            if ("PAN_CARD".equals(detectedType)) {
                extractedValue = extractedData
                        .path("pan")
                        .asText("")
                        .trim();

                if (extractedValue.isBlank()) {
                    throw new IllegalStateException(
                            "PAN number was not found in the document."
                    );
                }

            } else {
                extractedValue = extractedData
                        .path("gstin")
                        .asText("")
                        .trim();

                if (extractedValue.isBlank()) {
                    throw new IllegalStateException(
                            "GSTIN was not found in the document."
                    );
                }
            }

            // STEP 9: FIND BUSINESS
            currentStage = "BUSINESS PROFILE UPDATE";

            Business business = businessRepository
                    .findById(businessId)
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Business not found: " + businessId
                            )
                    );

            // STEP 10: UPDATE BUSINESS PROFILE
            if ("PAN_CARD".equals(detectedType)) {
                business.setPan(extractedValue);
                System.out.println("PAN saved to Business Profile.");

            } else {
                business.setGstin(extractedValue);
                System.out.println("GSTIN saved to Business Profile.");
            }

            businessRepository.save(business);

            // STEP 11: SAVE DOCUMENT EXTRACTION RESULT
            currentStage = "DOCUMENT RESULT SAVE";

            doc.setType(detectedType);
            doc.setExtractedJson(result.json());
            doc.setConfidenceJson(result.confidenceJson());
            doc.setRequiresReview(result.requiresReview());
            doc.setStatus("COMPLETED");
            doc.setMessage(null);

            documentRepository.save(doc);

            System.out.println("========== EXTRACTION SUCCESS ==========");
            System.out.println("Document ID: " + documentId);
            System.out.println("Detected Type: " + detectedType);
            System.out.println("Business Profile Updated");
            System.out.println("========================================");

        } catch (Exception e) {

            System.err.println("========== PROCESSING FAILED ==========");
            System.err.println("Document ID: " + documentId);
            System.err.println("Failed Stage: " + currentStage);
            System.err.println("Error: " + e.getMessage());

            // Print complete error details in backend terminal
            e.printStackTrace();

            doc.setStatus("FAILED");
            doc.setRequiresReview(true);
            doc.setExtractedJson(null);
            doc.setConfidenceJson(null);

            // Keep the user-facing message understandable
            doc.setMessage(
                    "Document processing failed during "
                            + currentStage
                            + ". Please check the document and try again."
            );

            try {
                documentRepository.save(doc);
            } catch (Exception saveError) {
                System.err.println(
                        "Could not save failure status:"
                );
                saveError.printStackTrace();
            }

            System.err.println("========================================");
        }
    }
}
