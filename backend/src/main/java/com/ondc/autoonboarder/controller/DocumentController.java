
package com.ondc.autoonboarder.controller;

import com.ondc.autoonboarder.dto.DocumentExtractionResponse;
import com.ondc.autoonboarder.dto.DocumentUploadResponse;
import com.ondc.autoonboarder.model.BusinessDocument;
import com.ondc.autoonboarder.repository.BusinessRepository;
import com.ondc.autoonboarder.service.DocumentService;

import jakarta.validation.constraints.NotBlank;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private BusinessRepository businessRepository;

    private String resolveBusinessId(Authentication auth) {
        String userId = auth != null
                ? auth.getPrincipal().toString()
                : null;

        if (userId == null) {
            throw new IllegalStateException("Unauthenticated");
        }

        return businessRepository.findByOwnerId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Business not found for user"
                        ))
                .getId();
    }

    @PostMapping("/upload")
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") @NotBlank String type,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);

        DocumentUploadResponse resp =
                documentService.storeFile(file, businessId, type);

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}/extraction")
    public ResponseEntity<DocumentExtractionResponse> getExtraction(
            @PathVariable("id") String docId,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);

        Optional<BusinessDocument> opt =
                documentService.getDocument(docId, businessId);

        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BusinessDocument doc = opt.get();

        DocumentExtractionResponse resp =
                new DocumentExtractionResponse(
                        doc.getId(),
                        doc.getType(),
                        doc.getStatus(),
                        doc.getExtractedJson(),
                        doc.getConfidenceJson(),
                        doc.getRequiresReview(),
                        doc.getMessage()
                );

        return ResponseEntity.ok(resp);
    }
}
