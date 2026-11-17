package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.dto.BusinessCreateRequest;
import com.ondc.autoonboarder.model.Business;
import com.ondc.autoonboarder.repository.BusinessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.Optional;

@Service
public class BusinessService {

    @Autowired
    private BusinessRepository businessRepository;

    private String getCurrentUserId(Authentication auth) {
        return auth != null ? auth.getPrincipal().toString() : null;
    }

    @Transactional
    public Business createBusiness(BusinessCreateRequest req, Authentication auth) {
        String userId = getCurrentUserId(auth);
        if (userId == null) throw new IllegalStateException("Unauthenticated");
        // ensure only one business per owner (optional)
        Optional<Business> existing = businessRepository.findByOwnerId(userId);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Business already exists for this user");
        }
        Business b = new Business();
        b.setOwnerId(userId);
        b.setBusinessName(req.businessName());
        b.setOwnerName(req.ownerName());
        b.setBusinessEmail(req.businessEmail());
        b.setContactNumber(req.contactNumber());
        b.setAddress(req.address());
        b.setState(req.state());
        b.setDistrict(req.district());
        b.setPinCode(req.pinCode());
        b.setBusinessCategory(req.businessCategory());
        b.setGstin(req.gstin());
        b.setPan(req.pan());
        b.setUdyamRegistration(req.udyamRegistration());
        b.setBusinessType(req.businessType());
        b.setPreferredSellingCategories(req.preferredSellingCategories());
        Instant now = Instant.now();
        b.setCreatedAt(now);
        b.setUpdatedAt(now);
        return businessRepository.save(b);
    }

    @Transactional(readOnly = true)
    public Business getMyBusiness(Authentication auth) {
        String userId = getCurrentUserId(auth);
        return businessRepository.findByOwnerId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Business not found"));
    }

    @Transactional
    public Business updateBusiness(BusinessCreateRequest req, Authentication auth) {
        Business b = getMyBusiness(auth);
        // Update mutable fields
        b.setBusinessName(req.businessName());
        b.setOwnerName(req.ownerName());
        b.setBusinessEmail(req.businessEmail());
        b.setContactNumber(req.contactNumber());
        b.setAddress(req.address());
        b.setState(req.state());
        b.setDistrict(req.district());
        b.setPinCode(req.pinCode());
        b.setBusinessCategory(req.businessCategory());
        b.setGstin(req.gstin());
        b.setPan(req.pan());
        b.setUdyamRegistration(req.udyamRegistration());
        b.setBusinessType(req.businessType());
        b.setPreferredSellingCategories(req.preferredSellingCategories());
        b.setUpdatedAt(Instant.now());
        return businessRepository.save(b);
    }
}
