package com.example.heatwaveadvisory.service;

import com.example.heatwaveadvisory.document.*;
import com.example.heatwaveadvisory.dto.ZoneResponse;
import com.example.heatwaveadvisory.exception.ConflictException;
import com.example.heatwaveadvisory.exception.ResourceNotFoundException;
import com.example.heatwaveadvisory.repository.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class ZoneService {
    private final MonitoringZoneRepository zones;
    private final RegionRepository regions;
    private final WeatherObservationRepository observations;
    private final HeatwaveAdvisoryRepository advisories;

    public ZoneService(MonitoringZoneRepository zones, RegionRepository regions,
                       WeatherObservationRepository observations, HeatwaveAdvisoryRepository advisories) {
        this.zones = zones;
        this.regions = regions;
        this.observations = observations;
        this.advisories = advisories;
    }

    public List<ZoneResponse> list(String regionId, String landUseType, String vulnerabilityLevel, String alertStatus) {
        return zones.findAll().stream()
                .filter(z -> regionId == null || regionId.isBlank() || regionId.equals(z.getRegionId()))
                .filter(z -> landUseType == null || landUseType.isBlank() || landUseType.equalsIgnoreCase(String.valueOf(z.getLandUseType())))
                .filter(z -> vulnerabilityLevel == null || vulnerabilityLevel.isBlank() || vulnerabilityLevel.equalsIgnoreCase(String.valueOf(z.getVulnerabilityLevel())))
                .map(this::toResponse)
                .filter(z -> alertStatus == null || alertStatus.isBlank()
                        || (z.latestAdvisory() != null && alertStatus.equalsIgnoreCase(z.latestAdvisory().getAlertStatus().name())))
                .toList();
    }

    public List<ZoneResponse> byRegion(String regionId) {
        if (!regions.existsById(regionId)) throw new ResourceNotFoundException("Region not found: " + regionId);
        return zones.findByRegionId(regionId).stream().map(this::toResponse).toList();
    }

    public ZoneResponse get(String id) { return toResponse(find(id)); }

    public MonitoringZoneDocument find(String id) {
        return zones.findById(id).orElseThrow(() -> new ResourceNotFoundException("Monitoring zone not found: " + id));
    }

    public ZoneResponse create(MonitoringZoneDocument input) {
        validateRegion(input.getRegionId());
        input.setId(null);
        Instant now = Instant.now();
        input.setCreatedAt(now);
        input.setUpdatedAt(now);
        return toResponse(zones.save(input));
    }

    public ZoneResponse update(String id, MonitoringZoneDocument input) {
        MonitoringZoneDocument existing = find(id);
        validateRegion(input.getRegionId());
        existing.setName(input.getName());
        existing.setRegionId(input.getRegionId());
        existing.setEstimatedPopulation(input.getEstimatedPopulation());
        existing.setAreaSqKm(input.getAreaSqKm());
        existing.setLandUseType(input.getLandUseType());
        existing.setVulnerabilityLevel(input.getVulnerabilityLevel());
        existing.setBaselineMaxTemperature(input.getBaselineMaxTemperature());
        existing.setCoolingInfrastructure(input.getCoolingInfrastructure());
        existing.setNotes(input.getNotes());
        existing.setUpdatedAt(Instant.now());
        return toResponse(zones.save(existing));
    }

    public void delete(String id) {
        MonitoringZoneDocument existing = find(id);
        if (observations.existsByZoneId(id) || advisories.existsByZoneId(id)) {
            throw new ConflictException("This zone has observations or advisories in its history. Remove the dependent history first; this prototype blocks deletion to prevent broken audit trails.");
        }
        zones.delete(existing);
    }

    public ZoneResponse toResponse(MonitoringZoneDocument zone) {
        RegionDocument region = regions.findById(zone.getRegionId()).orElse(null);
        List<WeatherObservationDocument> obs = observations.findByZoneIdOrderByObservedAtDesc(zone.getId());
        List<HeatwaveAdvisoryDocument> adv = advisories.findByZoneIdOrderByCreatedAtDesc(zone.getId());
        return new ZoneResponse(zone, region == null ? "Unknown region" : region.getName(),
                region == null || region.getTerrainType() == null ? "UNKNOWN" : region.getTerrainType().name(),
                obs.isEmpty() ? null : obs.getFirst(), adv.isEmpty() ? null : adv.getFirst());
    }

    private void validateRegion(String regionId) {
        if (regionId == null || !regions.existsById(regionId)) throw new ResourceNotFoundException("The selected region does not exist. Create the region before assigning a monitoring zone.");
    }
}
