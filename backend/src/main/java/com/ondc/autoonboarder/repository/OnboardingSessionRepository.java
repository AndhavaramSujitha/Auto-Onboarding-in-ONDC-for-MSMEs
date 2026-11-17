package com.ondc.autoonboarder.repository;

import com.ondc.autoonboarder.model.OnboardingSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OnboardingSessionRepository extends MongoRepository<OnboardingSession, String> {
    Optional<OnboardingSession> findByBusinessId(String businessId);
}
