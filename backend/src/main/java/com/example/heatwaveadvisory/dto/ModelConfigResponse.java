package com.example.heatwaveadvisory.dto;

import java.util.Map;

public record ModelConfigResponse(
        String version,
        Map<String, Double> terrainThresholds,
        double severeAbsoluteTemperature,
        double severeAboveTerrain,
        double severeHeatIndex,
        double warningDeparture,
        double warningHeatIndex,
        double watchNearThreshold,
        double watchDepartureMin,
        double watchDepartureMax,
        double watchHeatIndexMin,
        double watchHeatIndexMax,
        String heatIndexFormula,
        String disclaimer
) { }
