package com.ondc.autoonboarder.repository;

import com.ondc.autoonboarder.model.BulkJob;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BulkJobRepository extends MongoRepository<BulkJob, String> {
}
