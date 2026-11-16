package com.example.heatwaveadvisory.service;

import com.example.heatwaveadvisory.document.*;
import com.example.heatwaveadvisory.dto.DashboardSummary;
import com.example.heatwaveadvisory.dto.ZoneResponse;
import com.example.heatwaveadvisory.repository.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {
    private final RegionRepository regions;
    private final MonitoringZoneRepository zones;
    private final WeatherObservationRepository observations;
    private final HeatwaveAdvisoryRepository advisories;
    private final ZoneService zoneService;

    public DashboardService(RegionRepository regions, MonitoringZoneRepository zones,
                            WeatherObservationRepository observations, HeatwaveAdvisoryRepository advisories,
                            ZoneService zoneService) {
        this.regions = regions;
        this.zones = zones;
        this.observations = observations;
        this.advisories = advisories;
        this.zoneService = zoneService;
    }

    public DashboardSummary summary() {
        List<HeatwaveAdvisoryDocument> allAdvisories = advisories.findAllByOrderByCreatedAtDesc();
        List<WeatherObservationDocument> allObservations = observations.findAllByOrderByObservedAtDesc();
        List<ZoneResponse> allZones = zones.findAll().stream().map(zoneService::toResponse).toList();
        long active = allZones.stream().filter(z -> z.latestAdvisory() != null)
                .filter(z -> z.latestAdvisory().getAlertStatus() == AlertStatus.HEATWAVE_WARNING
                        || z.latestAdvisory().getAlertStatus() == AlertStatus.SEVERE_HEATWAVE_EMERGENCY).count();
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long recent = allAdvisories.stream().filter(a -> a.getCreatedAt() != null && a.getCreatedAt().isAfter(sevenDaysAgo)).count();
        long pending = allAdvisories.stream().filter(a -> a.getAcknowledgementStatus() == AcknowledgementStatus.PENDING_ACK).count();
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (AlertStatus status : AlertStatus.values()) {
            distribution.put(status.name(), allAdvisories.stream().filter(a -> a.getAlertStatus() == status).count());
        }
        return new DashboardSummary(regions.count(), zones.count(), active, recent, pending,
                allObservations.stream().limit(6).toList(), allAdvisories.stream().limit(6).toList(),
                allZones, distribution);
    }
}
