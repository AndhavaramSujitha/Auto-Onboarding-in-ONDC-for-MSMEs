
package com.ondc.autoonboarder.controller;

import com.ondc.autoonboarder.model.Product;
import com.ondc.autoonboarder.service.ProductService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/ondc")
public class OndcCallbackController {

    @Autowired
    private ProductService productService;

    @PostMapping("/on_search")
    public ResponseEntity<Map<String, Object>> onSearch(
            @RequestBody Map<String, Object> request) {

        System.out.println("ONDC on_search callback received");

        try {
            Map<String, Object> context =
                    (Map<String, Object>) request.get("context");

            if (context == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Missing context"));
            }

            String businessId =
                    context.get("business_id") != null
                            ? context.get("business_id").toString()
                            : null;

            if (businessId == null || businessId.isBlank()) {
                return ResponseEntity.badRequest().body(
                        Map.of("error",
                                "business_id is required for local testing"));
            }

            List<Product> products =
                    productService.getPublishedProductsByBusiness(businessId);

            List<Map<String, Object>> items = products.stream()
                    .map(product -> {
                        Map<String, Object> item = new HashMap<>();
                        item.put("id", product.getId());
                        item.put("name", product.getProductName());
                        item.put("description", product.getDescription());
                        item.put("category", product.getCategory());
                        item.put("price", product.getPrice());
                        item.put("currency", product.getCurrency());
                        item.put("quantity", product.getAvailableQuantity());
                        item.put("unit", product.getUnit());
                        item.put("images", product.getImages());
                        return item;
                    })
                    .toList();

            Map<String, Object> catalog = new HashMap<>();
            catalog.put("items", items);

            Map<String, Object> message = new HashMap<>();
            message.put("catalog", catalog);

            Map<String, Object> response = new HashMap<>();
            response.put("context", context);
            response.put("message", message);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("error", "Unable to prepare catalogue"));
        }
    }
}
