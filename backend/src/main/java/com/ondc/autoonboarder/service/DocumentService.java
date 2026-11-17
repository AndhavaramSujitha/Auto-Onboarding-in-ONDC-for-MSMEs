
package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.dto.DocumentUploadResponse;
import com.ondc.autoonboarder.model.BusinessDocument;
import com.ondc.autoonboarder.repository.BusinessDocumentRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class DocumentService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Autowired
    private BusinessDocumentRepository documentRepository;

    @Autowired
    private DocumentProcessingService documentProcessingService;

    public DocumentUploadResponse storeFile(
            MultipartFile file,
            String businessId,
            String type) {

        try {
            if (file == null || file.isEmpty()) {
                throw new IOException("Uploaded file is empty.");
            }

            if (file.getSize() > 10 * 1024 * 1024) {
                throw new IOException("Maximum file size is 10 MB.");
            }

            String extension = getExtension(file.getOriginalFilename());

            if (!extension.equalsIgnoreCase("pdf")) {
                throw new IOException("Only PDF files are supported.");
            }

            Path dir = Path.of(uploadDir).toAbsolutePath();
            Files.createDirectories(dir);

            String storedFileName = UUID.randomUUID() + ".pdf";
            Path target = dir.resolve(storedFileName);

            try (var input = file.getInputStream()) {
                Files.copy(input, target);
            }

            BusinessDocument doc = new BusinessDocument();

            doc.setBusinessId(businessId);

            // Store seller-selected type separately
            doc.setSelectedType(type);

            // Temporary value until AI identifies actual type
            doc.setType(type);

            doc.setOriginalFilename(file.getOriginalFilename());
            doc.setStoredPath(target.toString());
            doc.setUploadedAt(Instant.now());
            doc.setStatus("UPLOADED");
            doc.setRequiresReview(true);

            doc = documentRepository.save(doc);

            System.out.println("Document saved: " + doc.getId());

            // Process using separate Spring bean
            documentProcessingService.processDocumentAsync(
                    doc.getId(),
                    businessId
            );

            return new DocumentUploadResponse(
                    doc.getId(),
                    "UPLOADED",
                    "File stored and extraction started."
            );

        } catch (Exception e) {

            System.err.println(
                    "Document upload failed: " + e.getMessage()
            );

            return new DocumentUploadResponse(
                    null,
                    "FAILED",
                    "Unable to store file: " + e.getMessage()
            );
        }
    }

    private String getExtension(String filename) {

        if (filename == null) {
            return "";
        }

        int idx = filename.lastIndexOf('.');

        return idx > 0
                ? filename.substring(idx + 1)
                : "";
    }

    public Optional<BusinessDocument> getDocument(
            String documentId,
            String businessId) {

        return documentRepository.findByIdAndBusinessId(
                documentId,
                businessId
        );
    }
}
