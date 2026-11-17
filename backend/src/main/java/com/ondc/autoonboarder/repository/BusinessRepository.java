package com.ondc.autoonboarder.repository;

import com.ondc.autoonboarder.model.Business;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface BusinessRepository extends MongoRepository<Business, String> {
    Optional<Business> findByOwnerId(String ownerId);
}
