package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.dto.ProductCreateRequest;
import com.ondc.autoonboarder.model.Product;
import com.ondc.autoonboarder.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    private String getCurrentBusinessId(Authentication auth) {
        // Reuse Business resolution from DocumentService (ownerId->businessId)
        // For simplicity, assume a helper bean exists; here we query directly.
        // This method will be overridden later if needed.
        return null; // placeholder – will be injected by controller.
    }

    @Transactional
    public Product createProduct(ProductCreateRequest req, String businessId) {
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
        p.setComplianceStatus("PENDING");
        Instant now = Instant.now();
        p.setCreatedAt(now);
        p.setUpdatedAt(now);
        return productRepository.save(p);
    }

    @Transactional(readOnly = true)
    public List<Product> getProductsByBusiness(String businessId) {
        return productRepository.findByBusinessId(businessId);
    }

    @Transactional(readOnly = true)
    public Product getProduct(String productId, String businessId) {
        return productRepository.findById(productId)
                .filter(p -> businessId.equals(p.getBusinessId()))
                .orElseThrow(() -> new IllegalArgumentException("Product not found or access denied"));
    }

    @Transactional
    public Product updateProduct(String productId, ProductCreateRequest req, String businessId) {
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
        return productRepository.save(p);
    }

    @Transactional
    public void deleteProduct(String productId, String businessId) {
        Product p = getProduct(productId, businessId);
        productRepository.delete(p);
    }
}
