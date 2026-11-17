
package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.dto.ImageAnalysisResponse;
import com.ondc.autoonboarder.model.BusinessDocument;
import com.ondc.autoonboarder.repository.BusinessDocumentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;

@Service
public class ImageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private BusinessDocumentRepository documentRepository;

    @Autowired
    private GroqService groqService;

    public ImageAnalysisResponse storeAndAnalyze(MultipartFile file, String businessId) {
        try {
            Path dir = Path.of(uploadDir).toAbsolutePath();
            Files.createDirectories(dir);

            String ext = getExtension(file.getOriginalFilename());
            String stored = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);
            Path target = dir.resolve(stored);

            Files.copy(file.getInputStream(), target);

            BusinessDocument doc = new BusinessDocument();
            doc.setBusinessId(businessId);
            doc.setType("PRODUCT_IMAGE");
            doc.setOriginalFilename(file.getOriginalFilename());
            doc.setStoredPath(target.toString());
            doc.setUploadedAt(Instant.now());
            doc.setStatus("UPLOADED");

            documentRepository.save(doc);

            analyzeAsync(doc.getId(), businessId);

            return new ImageAnalysisResponse(
                doc.getId(),
                "UPLOADED",
                null,
                null,
                null,
                "Image stored, processing started"
            );

        } catch (Exception e) {
            return new ImageAnalysisResponse(
                null,
                "FAILED",
                null,
                null,
                null,
                "Error: " + e.getMessage()
            );
        }
    }

    private String getExtension(String name) {
        if (name == null) return "";

        int i = name.lastIndexOf('.');
        return (i > 0) ? name.substring(i + 1) : "";
    }

    public java.util.Optional<BusinessDocument> getDocument(
            String documentId, String businessId) {

        return documentRepository.findByIdAndBusinessId(documentId, businessId);
    }

    @Async
    public void analyzeAsync(String documentId, String businessId) {

        BusinessDocument doc = documentRepository
                .findByIdAndBusinessId(documentId, businessId)
                .orElse(null);

        if (doc == null) return;

        try {
            doc.setStatus("PROCESSING");
            documentRepository.save(doc);

            var result = groqService.extractProductInfoFromImage(
                    new File(doc.getStoredPath())
            );

            doc.setExtractedJson(result.json());
            doc.setConfidenceJson(result.confidenceJson());
            doc.setRequiresReview(result.requiresReview());
            doc.setStatus("COMPLETED");

            documentRepository.save(doc);

        } catch (Exception e) {
            doc.setStatus("FAILED");
            documentRepository.save(doc);
        }
    }
}
