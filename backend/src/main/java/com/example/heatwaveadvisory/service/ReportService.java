package com.example.heatwaveadvisory.service;

import com.example.heatwaveadvisory.document.AlertStatus;
import com.example.heatwaveadvisory.document.HeatwaveAdvisoryDocument;
import com.example.heatwaveadvisory.document.VulnerabilityLevel;
import com.example.heatwaveadvisory.document.WeatherObservationDocument;
import com.example.heatwaveadvisory.dto.RegionRiskSummary;
import com.example.heatwaveadvisory.dto.ReportSummary;
import com.example.heatwaveadvisory.dto.ZoneResponse;
import com.example.heatwaveadvisory.repository.HeatwaveAdvisoryRepository;
import com.example.heatwaveadvisory.repository.WeatherObservationRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {
    private final ZoneService zones;
    private final WeatherObservationRepository observations;
    private final HeatwaveAdvisoryRepository advisories;

    public ReportService(ZoneService zones, WeatherObservationRepository observations, HeatwaveAdvisoryRepository advisories) {
        this.zones = zones;
        this.observations = observations;
        this.advisories = advisories;
    }

    public ReportSummary summary(String zoneId) {
        List<ZoneResponse> allZoneSummaries = zones.list(null, null, null, null);
        List<ZoneResponse> zoneSummaries = allZoneSummaries.stream()
                .filter(z -> zoneId == null || zoneId.isBlank() || zoneId.equals(z.zone().getId())).toList();
        String selectedRegionId = zoneId == null || zoneId.isBlank() || zoneSummaries.isEmpty()
                ? null : zoneSummaries.getFirst().zone().getRegionId();
        List<ZoneResponse> regionContext = zoneId == null || zoneId.isBlank() ? allZoneSummaries
                : selectedRegionId == null ? List.of()
                : allZoneSummaries.stream().filter(z -> selectedRegionId.equals(z.zone().getRegionId())).toList();
        List<ZoneResponse> highRisk = zoneSummaries.stream().filter(z -> z.latestAdvisory() != null)
                .filter(z -> z.latestAdvisory().getAlertStatus() == AlertStatus.HEATWAVE_WARNING
                        || z.latestAdvisory().getAlertStatus() == AlertStatus.SEVERE_HEATWAVE_EMERGENCY).toList();
        List<RegionRiskSummary> regionRisk = regionContext.stream()
                .collect(Collectors.groupingBy(z -> z.zone().getRegionId(), LinkedHashMap::new, Collectors.toList()))
                .entrySet().stream().map(entry -> toRegionRisk(entry.getKey(), entry.getValue())).toList();
        List<WeatherObservationDocument> obs = observations.findAllByOrderByObservedAtDesc().stream()
                .filter(o -> zoneId == null || zoneId.isBlank() || zoneId.equals(o.getZoneId())).toList();
        List<HeatwaveAdvisoryDocument> adv = advisories.findAllByOrderByCreatedAtDesc().stream()
                .filter(a -> zoneId == null || zoneId.isBlank() || zoneId.equals(a.getZoneId())).toList();
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (AlertStatus status : AlertStatus.values()) {
            distribution.put(status.name(), adv.stream().filter(a -> a.getAlertStatus() == status).count());
        }
        return new ReportSummary(zoneSummaries, highRisk, regionRisk, obs, adv, distribution);
    }

    private RegionRiskSummary toRegionRisk(String regionId, List<ZoneResponse> items) {
        long severe = count(items, AlertStatus.SEVERE_HEATWAVE_EMERGENCY);
        long warning = count(items, AlertStatus.HEATWAVE_WARNING);
        long watch = count(items, AlertStatus.HEAT_WATCH_CAUTION);
        long normal = count(items, AlertStatus.NORMAL_CONDITIONS);
        long review = count(items, AlertStatus.REVIEW_REQUIRED);
        long unclassified = items.stream().filter(z -> z.latestAdvisory() == null).count();
        long vulnerable = items.stream().filter(z -> z.zone().getVulnerabilityLevel() == VulnerabilityLevel.HIGH
                || z.zone().getVulnerabilityLevel() == VulnerabilityLevel.CRITICAL).count();
        return new RegionRiskSummary(regionId, items.getFirst().regionName(), items.size(), vulnerable,
                severe + warning, severe, warning, watch, normal, review, unclassified);
    }

    private long count(List<ZoneResponse> items, AlertStatus status) {
        return items.stream().filter(z -> z.latestAdvisory() != null)
                .filter(z -> z.latestAdvisory().getAlertStatus() == status).count();
    }
}
