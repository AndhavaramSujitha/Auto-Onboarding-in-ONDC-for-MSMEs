
package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.dto.ProductCreateRequest;
import com.ondc.autoonboarder.model.Product;
import com.ondc.autoonboarder.repository.ProductRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Create product and automatically run compliance audit
    @Transactional
    public Product createProduct(
            ProductCreateRequest req,
            String businessId) {

        Product p = new Product();

        p.setBusinessId(businessId);
        p.setProductName(req.productName());
        p.setDescription(req.description());
        p.setCategory(req.category());
        p.setSubcategory(req.subcategory());
        p.setBrand(req.brand());
        p.setSku(req.sku());
        p.setPrice(req.price());
        p.setCurrency(req.currency());
        p.setAvailableQuantity(req.availableQuantity());
        p.setUnit(req.unit());
        p.setAttributes(req.attributes());
        p.setImages(null);

        p.setStatus("DRAFT");

        Instant now = Instant.now();
        p.setCreatedAt(now);
        p.setUpdatedAt(now);

        // Automatically calculate and save compliance status
        applyComplianceAudit(p);

        return productRepository.save(p);
    }

    // Get all products belonging to a business
    @Transactional(readOnly = true)
    public List<Product> getProductsByBusiness(String businessId) {

        return productRepository.findByBusinessId(businessId);
    }

    // Get products eligible for ONDC catalogue preparation
    @Transactional(readOnly = true)
    public List<Product> getPublishedProductsByBusiness(
            String businessId) {

        return productRepository.findByBusinessId(businessId)
                .stream()
                .filter(p -> "PUBLISHED".equalsIgnoreCase(p.getStatus()))
                .filter(p -> "PASSED".equalsIgnoreCase(p.getComplianceStatus()))
                .filter(p -> p.getAvailableQuantity() > 0)
                .toList();
    }

    // Get single product
    @Transactional(readOnly = true)
    public Product getProduct(
            String productId,
            String businessId) {

        return productRepository.findById(productId)
                .filter(p -> businessId.equals(p.getBusinessId()))
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found or access denied"));
    }

    // Update product and automatically rerun compliance audit
    @Transactional
    public Product updateProduct(
            String productId,
            ProductCreateRequest req,
            String businessId) {

        Product p = getProduct(productId, businessId);

        p.setProductName(req.productName());
        p.setDescription(req.description());
        p.setCategory(req.category());
        p.setSubcategory(req.subcategory());
        p.setBrand(req.brand());
        p.setSku(req.sku());
        p.setPrice(req.price());
        p.setCurrency(req.currency());
        p.setAvailableQuantity(req.availableQuantity());
        p.setUnit(req.unit());
        p.setAttributes(req.attributes());

        p.setUpdatedAt(Instant.now());

        // Automatically calculate the latest compliance status
        applyComplianceAudit(p);

        return productRepository.save(p);
    }

    // Publish product only after checking its latest compliance
    @Transactional
    public Product publishProduct(
            String productId,
            String businessId) {

        Product p = getProduct(productId, businessId);

        // Run audit again before publishing
        applyComplianceAudit(p);

        if (!"PASSED".equalsIgnoreCase(p.getComplianceStatus())) {
            throw new IllegalStateException(
                    "Product cannot be published. Compliance status: "
                            + p.getComplianceStatus()
                            + ". Please fix missing product details and try again.");
        }

        p.setStatus("PUBLISHED");
        p.setUpdatedAt(Instant.now());

        return productRepository.save(p);
    }

    // Run backend compliance audit manually when requested
    @Transactional
    public Product runComplianceAudit(
            String productId,
            String businessId) {

        Product p = getProduct(productId, businessId);

        applyComplianceAudit(p);

        return productRepository.save(p);
    }

    // Common compliance audit logic
    private void applyComplianceAudit(Product p) {

        int passed = 0;
        int total = 7;

        // 1. SKU validation
        if (p.getSku() != null &&
                p.getSku().trim().length() >= 3) {
            passed++;
        }

        // 2. Description validation
        if (p.getDescription() != null &&
                p.getDescription().trim().length() >= 15) {
            passed++;
        }

        // 3. Price validation
        if (p.getPrice() > 0) {
            passed++;
        }

        // 4. Stock validation
        if (p.getAvailableQuantity() > 0) {
            passed++;
        }

        // 5. Country of Origin validation
        Map<String, Object> attributes = p.getAttributes();

        if (attributes != null &&
                hasValidOrigin(attributes)) {
            passed++;
        }

        // 6. Unit validation
        if (p.getUnit() != null &&
                !p.getUnit().trim().isEmpty()) {
            passed++;
        }

        // 7. Brand validation
        if (p.getBrand() != null &&
                !p.getBrand().trim().isEmpty()) {
            passed++;
        }

        int score = (passed * 100) / total;

        String complianceStatus;

        if (score < 60) {
            complianceStatus = "FAILED";
        } else if (score < 90) {
            complianceStatus = "WARNING";
        } else {
            complianceStatus = "PASSED";
        }

        p.setComplianceStatus(complianceStatus);
        p.setUpdatedAt(Instant.now());
    }

    // Check Country of Origin attributes
    private boolean hasValidOrigin(Map<String, Object> attributes) {

        String[] possibleKeys = {
                "Country of Origin",
                "country_of_origin",
                "origin",
                "Origin"
        };

        for (String key : possibleKeys) {

            Object value = attributes.get(key);

            if (value != null &&
                    !value.toString().trim().isEmpty()) {
                return true;
            }
        }

        return false;
    }

    // Delete product
    @Transactional
    public void deleteProduct(
            String productId,
            String businessId) {

        Product p = getProduct(productId, businessId);

        productRepository.delete(p);
    }
}
