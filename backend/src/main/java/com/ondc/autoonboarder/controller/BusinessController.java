
package com.ondc.autoonboarder.controller;

import com.ondc.autoonboarder.dto.BusinessCreateRequest;
import com.ondc.autoonboarder.dto.BusinessResponse;
import com.ondc.autoonboarder.model.Business;
import com.ondc.autoonboarder.service.BusinessService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/businesses")
public class BusinessController {

    @Autowired
    private BusinessService businessService;

    private BusinessResponse toResponse(Business b) {
        return new BusinessResponse(
                b.getId(),
                b.getOwnerId(),
                b.getBusinessName(),
                b.getOwnerName(),
                b.getBusinessEmail(),
                b.getContactNumber(),
                b.getAddress(),
                b.getState(),
                b.getDistrict(),
                b.getPinCode(),
                b.getBusinessCategory(),
                b.getGstin(),
                b.getPan(),
                b.getUdyamRegistration(),
                b.getBusinessType(),
                b.getPreferredSellingCategories(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    @PostMapping
    public ResponseEntity<BusinessResponse> createBusiness(
            @Valid @RequestBody BusinessCreateRequest req,
            Authentication auth) {

        Business b = businessService.createBusiness(req, auth);
        return ResponseEntity.ok(toResponse(b));
    }

    @GetMapping("/me")
    public ResponseEntity<BusinessResponse> getMyBusiness(
            Authentication auth) {

        try {
            Business b = businessService.getMyBusiness(auth);
            return ResponseEntity.ok(toResponse(b));

        } catch (IllegalArgumentException ex) {
            if ("Business not found".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            throw ex;
        }
    }

    @PutMapping("/me")
    public ResponseEntity<BusinessResponse> updateBusiness(
            @Valid @RequestBody BusinessCreateRequest req,
            Authentication auth) {

        Business b = businessService.updateBusiness(req, auth);
        return ResponseEntity.ok(toResponse(b));
    }
}
