package com.example.heatwaveadvisory.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "heatwave.model")
public class HeatwaveModelConfig {
    private String version = "CES-HW-RULES-v1.0";
    private Map<String, Double> terrainThresholds = new LinkedHashMap<>(Map.of(
            "PLAINS", 40.0, "COASTAL", 37.0, "HILLY", 30.0));
    private double severeAbsoluteTemperature = 45.0;
    private double severeAboveTerrain = 6.0;
    private double severeHeatIndex = 50.0;
    private double warningDeparture = 4.5;
    private double warningHeatIndex = 44.0;
    private double watchNearThreshold = 2.0;
    private double watchDepartureMin = 2.5;
    private double watchDepartureMax = 4.4;
    private double watchHeatIndexMin = 38.0;
    private double watchHeatIndexMax = 43.9;

    public double thresholdFor(String terrain) {
        return terrainThresholds.getOrDefault(terrain, 40.0);
    }
}
