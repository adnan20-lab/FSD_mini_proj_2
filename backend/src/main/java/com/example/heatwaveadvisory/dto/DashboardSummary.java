package com.example.heatwaveadvisory.dto;

import com.example.heatwaveadvisory.document.HeatwaveAdvisoryDocument;
import com.example.heatwaveadvisory.document.WeatherObservationDocument;

import java.util.List;
import java.util.Map;

public record DashboardSummary(
        long totalRegions,
        long totalZones,
        long activeHeatwaveZones,
        long recentAdvisories,
        long pendingAcknowledgements,
        List<WeatherObservationDocument> recentObservations,
        List<HeatwaveAdvisoryDocument> latestAdvisories,
        List<ZoneResponse> zoneOverview,
        Map<String, Long> severityDistribution
) { }
