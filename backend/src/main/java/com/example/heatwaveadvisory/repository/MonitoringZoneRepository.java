package com.example.heatwaveadvisory.repository;

import com.example.heatwaveadvisory.document.MonitoringZoneDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MonitoringZoneRepository extends MongoRepository<MonitoringZoneDocument, String> {
    List<MonitoringZoneDocument> findByRegionId(String regionId);
}
