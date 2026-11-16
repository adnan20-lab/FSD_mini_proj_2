package com.example.heatwaveadvisory.repository;

import com.example.heatwaveadvisory.document.RegionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RegionRepository extends MongoRepository<RegionDocument, String> { }
