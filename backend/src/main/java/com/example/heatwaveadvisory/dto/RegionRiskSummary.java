package com.example.heatwaveadvisory.dto;

/** Aggregated current risk posture for a region's monitored zones. */
public record RegionRiskSummary(
        String regionId,
        String regionName,
        long totalZones,
        long highVulnerabilityZones,
        long activeHeatwaveZones,
        long severeEmergencyZones,
        long warningZones,
        long watchZones,
        long normalZones,
        long reviewRequiredZones,
        long zonesWithoutAdvisory
) { }
