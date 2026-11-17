package com.ondc.autoonboarder.repository;

import com.ondc.autoonboarder.model.BusinessDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface BusinessDocumentRepository extends MongoRepository<BusinessDocument, String> {
    List<BusinessDocument> findByBusinessId(String businessId);
    Optional<BusinessDocument> findByIdAndBusinessId(String id, String businessId);
}
