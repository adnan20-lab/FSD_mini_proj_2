package com.example.heatwaveadvisory.service;

import com.example.heatwaveadvisory.document.*;
import com.example.heatwaveadvisory.engine.HeatwaveDecisionEngine;
import com.example.heatwaveadvisory.exception.ResourceNotFoundException;
import com.example.heatwaveadvisory.repository.HeatwaveAdvisoryRepository;
import com.example.heatwaveadvisory.repository.RegionRepository;
import com.example.heatwaveadvisory.repository.WeatherObservationRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AdvisoryService {
    private final HeatwaveAdvisoryRepository advisories;
    private final WeatherObservationRepository observations;
    private final RegionRepository regions;
    private final ZoneService zones;
    private final HeatwaveDecisionEngine engine;

    public AdvisoryService(HeatwaveAdvisoryRepository advisories, WeatherObservationRepository observations,
                           RegionRepository regions, ZoneService zones, HeatwaveDecisionEngine engine) {
        this.advisories = advisories;
        this.observations = observations;
        this.regions = regions;
        this.zones = zones;
        this.engine = engine;
    }

    public HeatwaveAdvisoryDocument generate(String observationId) {
        WeatherObservationDocument observation = observations.findById(observationId)
                .orElseThrow(() -> new ResourceNotFoundException("Observation not found: " + observationId));
        MonitoringZoneDocument zone = zones.find(observation.getZoneId());
        RegionDocument region = regions.findById(zone.getRegionId())
                .orElseThrow(() -> new ResourceNotFoundException("Region associated with this zone was not found."));
        HeatwaveAdvisoryDocument advisory = engine.evaluate(observation, zone, region);
        return advisories.save(advisory);
    }

    public List<HeatwaveAdvisoryDocument> list(String zoneId, String alertStatus, Boolean acknowledged,
                                              Instant from, Instant to) {
        return advisories.findAllByOrderByCreatedAtDesc().stream()
                .filter(a -> zoneId == null || zoneId.isBlank() || zoneId.equals(a.getZoneId()))
                .filter(a -> alertStatus == null || alertStatus.isBlank() || alertStatus.equalsIgnoreCase(a.getAlertStatus().name()))
                .filter(a -> acknowledged == null || (a.getAcknowledgementStatus() == AcknowledgementStatus.ACKNOWLEDGED) == acknowledged)
                .filter(a -> from == null || (a.getCreatedAt() != null && !a.getCreatedAt().isBefore(from)))
                .filter(a -> to == null || (a.getCreatedAt() != null && !a.getCreatedAt().isAfter(to)))
                .toList();
    }

    public HeatwaveAdvisoryDocument get(String id) {
        return advisories.findById(id).orElseThrow(() -> new ResourceNotFoundException("Advisory not found: " + id));
    }

    public HeatwaveAdvisoryDocument acknowledge(String id, String acknowledgedBy) {
        HeatwaveAdvisoryDocument advisory = get(id);
        if (advisory.getAcknowledgementStatus() != AcknowledgementStatus.ACKNOWLEDGED) {
            advisory.setAcknowledgementStatus(AcknowledgementStatus.ACKNOWLEDGED);
            advisory.setAcknowledgedAt(Instant.now());
            advisory.setAcknowledgedBy(acknowledgedBy == null || acknowledgedBy.isBlank() ? "Civic Authority" : acknowledgedBy.trim());
            advisories.save(advisory);
        }
        return advisory;
    }
}
