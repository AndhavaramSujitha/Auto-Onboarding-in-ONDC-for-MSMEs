package com.ondc.autoonboarder.repository;

import com.ondc.autoonboarder.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    List<Product> findByBusinessId(String businessId);
}
