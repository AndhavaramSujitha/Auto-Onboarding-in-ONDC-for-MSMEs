
package com.ondc.autoonboarder.controller;

import com.ondc.autoonboarder.dto.ImageAnalysisResponse;
import com.ondc.autoonboarder.dto.ProductCreateRequest;
import com.ondc.autoonboarder.dto.ProductResponse;
import com.ondc.autoonboarder.model.BusinessDocument;
import com.ondc.autoonboarder.model.Product;
import com.ondc.autoonboarder.repository.BusinessRepository;
import com.ondc.autoonboarder.service.GroqService;
import com.ondc.autoonboarder.service.ImageService;
import com.ondc.autoonboarder.service.ProductService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ImageService imageService;

    @Autowired
    private GroqService groqService;

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
                        new IllegalArgumentException("Business not found for user"))
                .getId();
    }

    // Generate AI product catalog details
    @PostMapping(
            value = "/generate-catalog",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<String> generateCatalog(
            @RequestParam("description") String description,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication auth) {

        // Verify authenticated seller has a business
        resolveBusinessId(auth);

        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException(
                    "Product description is required"
            );
        }

        // Generate catalog details using Groq AI.
        // Product is NOT saved here.
        String generatedCatalog =
                groqService.generateProductCatalog(description, image);

        return ResponseEntity.ok(generatedCatalog);
    }

    // Create product
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductCreateRequest req,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);
        Product p = productService.createProduct(req, businessId);

        return ResponseEntity.ok(toResponse(p));
    }

    // List products
    @GetMapping
    public ResponseEntity<List<ProductResponse>> listProducts(
            Authentication auth) {

        String businessId = resolveBusinessId(auth);

        List<Product> list =
                productService.getProductsByBusiness(businessId);

        List<ProductResponse> resp = list.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(resp);
    }

    // Get product
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProduct(
            @PathVariable String id,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);
        Product p = productService.getProduct(id, businessId);

        return ResponseEntity.ok(toResponse(p));
    }

    // Update product
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody ProductCreateRequest req,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);

        Product p = productService.updateProduct(id, req, businessId);

        return ResponseEntity.ok(toResponse(p));
    }

    // Delete product
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable String id,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);

        productService.deleteProduct(id, businessId);

        return ResponseEntity.noContent().build();
    }

    // Upload product image (existing image analysis feature)
    @PostMapping("/image")
    public ResponseEntity<ImageAnalysisResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);

        ImageAnalysisResponse resp =
                imageService.storeAndAnalyze(file, businessId);

        return ResponseEntity.ok(resp);
    }

    // Get image analysis
    @GetMapping("/image/{id}/analysis")
    public ResponseEntity<ImageAnalysisResponse> getImageAnalysis(
            @PathVariable("id") String docId,
            Authentication auth) {

        String businessId = resolveBusinessId(auth);

        var opt = imageService.getDocument(docId, businessId);

        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        BusinessDocument doc = opt.get();

        ImageAnalysisResponse resp = new ImageAnalysisResponse(
                doc.getId(),
                doc.getStatus(),
                doc.getExtractedJson(),
                doc.getConfidenceJson(),
                doc.getRequiresReview(),
                ""
        );

        return ResponseEntity.ok(resp);
    }

    private ProductResponse toResponse(Product p) {

        return new ProductResponse(
                p.getId(),
                p.getBusinessId(),
                p.getProductName(),
                p.getDescription(),
                p.getCategory(),
                p.getSubcategory(),
                p.getBrand(),
                p.getSku(),
                p.getPrice(),
                p.getCurrency(),
                p.getAvailableQuantity(),
                p.getUnit(),
                p.getImages(),
                p.getAttributes(),
                p.getStatus(),
                p.getComplianceStatus(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
