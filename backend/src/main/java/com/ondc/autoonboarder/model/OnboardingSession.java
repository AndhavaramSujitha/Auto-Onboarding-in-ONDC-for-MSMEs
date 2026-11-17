package com.ondc.autoonboarder.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "onboarding_sessions")
public class OnboardingSession {
    @Id
    private String id;
    private String businessId;
    private String currentStep; // e.g., ACCOUNT_REGISTRATION, BUSINESS_PROFILE, DOCUMENT_UPLOAD, OCR_PROCESSING, CATALOG_GENERATION, COMPLIANCE_CHECK, ONDC_INTEGRATION, COMPLETE
    private String state; // NOT_STARTED, IN_PROGRESS, COMPLETED, NEEDS_ATTENTION, FAILED
    private String statusMessage; // optional human‑readable details
    private Instant createdAt;
    private Instant updatedAt;

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBusinessId() { return businessId; }
    public void setBusinessId(String businessId) { this.businessId = businessId; }
    public String getCurrentStep() { return currentStep; }
    public void setCurrentStep(String currentStep) { this.currentStep = currentStep; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
