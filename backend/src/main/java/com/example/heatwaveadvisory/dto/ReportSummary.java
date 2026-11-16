package com.example.heatwaveadvisory.dto;

import com.example.heatwaveadvisory.document.HeatwaveAdvisoryDocument;
import com.example.heatwaveadvisory.document.WeatherObservationDocument;

import java.util.List;
import java.util.Map;

public record ReportSummary(
        List<ZoneResponse> zoneRiskSummaries,
        List<ZoneResponse> highAlertZones,
        List<RegionRiskSummary> regionRiskSummaries,
        List<WeatherObservationDocument> observations,
        List<HeatwaveAdvisoryDocument> advisories,
        Map<String, Long> severityDistribution
) { }
