package com.example.heatwaveadvisory.repository;

import com.example.heatwaveadvisory.document.WeatherObservationDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WeatherObservationRepository extends MongoRepository<WeatherObservationDocument, String> {
    List<WeatherObservationDocument> findByZoneIdOrderByObservedAtDesc(String zoneId);
    List<WeatherObservationDocument> findAllByOrderByObservedAtDesc();
    boolean existsByZoneId(String zoneId);
}
