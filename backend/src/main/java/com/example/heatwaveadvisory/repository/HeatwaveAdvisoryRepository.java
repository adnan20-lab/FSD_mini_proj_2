package com.example.heatwaveadvisory.repository;

import com.example.heatwaveadvisory.document.HeatwaveAdvisoryDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HeatwaveAdvisoryRepository extends MongoRepository<HeatwaveAdvisoryDocument, String> {
    List<HeatwaveAdvisoryDocument> findByZoneIdOrderByCreatedAtDesc(String zoneId);
    List<HeatwaveAdvisoryDocument> findAllByOrderByCreatedAtDesc();
    boolean existsByZoneId(String zoneId);
    boolean existsByObservationId(String observationId);
}
