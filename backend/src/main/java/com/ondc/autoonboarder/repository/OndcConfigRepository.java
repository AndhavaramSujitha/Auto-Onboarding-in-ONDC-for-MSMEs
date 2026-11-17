package com.ondc.autoonboarder.repository;

import com.ondc.autoonboarder.model.OndcConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OndcConfigRepository extends MongoRepository<OndcConfig, String> {
    Optional<OndcConfig> findByBusinessId(String businessId);
}
