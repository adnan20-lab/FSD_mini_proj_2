package com.example.heatwaveadvisory.engine;

import com.example.heatwaveadvisory.config.HeatwaveModelConfig;
import com.example.heatwaveadvisory.document.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;

/** Explainable rule engine. Thresholds are academic prototype parameters, not official warning criteria. */
@Component
public class HeatwaveDecisionEngine {
    private final HeatwaveModelConfig config;

    public HeatwaveDecisionEngine(HeatwaveModelConfig config) {
        this.config = config;
    }

    public HeatwaveAdvisoryDocument evaluate(WeatherObservationDocument observation,
                                             MonitoringZoneDocument zone,
                                             RegionDocument region) {
        HeatwaveAdvisoryDocument result = new HeatwaveAdvisoryDocument();
        result.setZoneId(zone.getId());
        result.setZoneNameSnapshot(zone.getName());
        result.setRegionId(region.getId());
        result.setRegionNameSnapshot(region.getName());
        result.setObservationId(observation.getId());
        result.setObservationAt(observation.getObservedAt());
        Instant evaluatedAt = Instant.now();
        result.setCreatedAt(evaluatedAt);
        result.setModelVersion(config.getVersion());
        result.setAcknowledgementStatus(AcknowledgementStatus.PENDING_ACK);

        Double max = observation.getMaxTemperature();
        Double min = observation.getMinTemperature();
        Double humidity = observation.getRelativeHumidity();
        Double baseline = zone.getBaselineMaxTemperature();
        Double windSpeed = observation.getWindSpeedKmh();
        Integer recordedHotDays = observation.getConsecutiveHotDays();
        boolean invalidMeasurements = max == null || min == null || humidity == null || baseline == null
                || windSpeed == null || recordedHotDays == null
                || (max != null && (!Double.isFinite(max) || max < -10.0 || max > 60.0))
                || (min != null && (!Double.isFinite(min) || min < -15.0 || min > 60.0))
                || (humidity != null && (!Double.isFinite(humidity) || humidity < 0.0 || humidity > 100.0))
                || (baseline != null && (!Double.isFinite(baseline) || baseline < 15.0 || baseline > 50.0))
                || (windSpeed != null && (!Double.isFinite(windSpeed) || windSpeed < 0.0 || windSpeed > 200.0))
                || (recordedHotDays != null && (recordedHotDays < 0 || recordedHotDays > 90))
                || (observation.getUvIndex() != null && (!Double.isFinite(observation.getUvIndex()) || observation.getUvIndex() < 0.0 || observation.getUvIndex() > 15.0))
                || (min != null && max != null && min > max);
        if (invalidMeasurements || observation.getObservedAt() == null
                || observation.getObservedAt().isAfter(evaluatedAt.plusSeconds(60))
                || region.getTerrainType() == null || zone.getLandUseType() == null
                || zone.getVulnerabilityLevel() == null) {
            result.setAlertStatus(AlertStatus.REVIEW_REQUIRED);
            result.setReasoning("The observation or zone baseline is incomplete or inconsistent. A reviewer must verify maximum temperature, minimum temperature, relative humidity, and the historical baseline before an alert can be assigned.");
            result.setAppliedRules(List.of("INPUT_VALIDATION_FAILED"));
            result.setNextEvaluationAt(null);
            result.setOutdoorRestrictionHours(null);
            result.setCoolingCenterOperatingHours(null);
            result.setEstimatedGridDemandSurgePercent(null);
            result.setPeakExposureWindow("Not calculated — review required");
            result.setSectorActions(sectorActions(AlertStatus.REVIEW_REQUIRED, zone));
            result.setInputSnapshot(snapshot(observation, zone));
            return result;
        }

        double terrainThreshold = config.thresholdFor(region.getTerrainType().name());
        double departure = round2(max - baseline);
        double heatIndex = round2(calculateHeatIndex(max, humidity));
        boolean warmNight = min >= 28.0;
        int hotDays = observation.getConsecutiveHotDays() == null ? 0 : observation.getConsecutiveHotDays();
        boolean severePersistence = zone.getVulnerabilityLevel() == VulnerabilityLevel.CRITICAL
                && warmNight && min >= 30.0 && hotDays >= 3;

        result.setTerrainThreshold(terrainThreshold);
        result.setTemperatureDeparture(departure);
        result.setHeatIndex(heatIndex);
        result.setWarmNightConcern(warmNight);
        result.setConsecutiveHotDays(hotDays);
        result.setInputSnapshot(snapshot(observation, zone));

        List<String> rules = new ArrayList<>();
        AlertStatus status;
        // Priority: severe overrides warning; warning overrides watch; otherwise normal.
        if (max >= config.getSevereAbsoluteTemperature()
                || max >= terrainThreshold + config.getSevereAboveTerrain()
                || heatIndex >= config.getSevereHeatIndex()
                || severePersistence) {
            status = AlertStatus.SEVERE_HEATWAVE_EMERGENCY;
            if (max >= config.getSevereAbsoluteTemperature()) rules.add("SEVERE_ABSOLUTE_TEMPERATURE");
            if (max >= terrainThreshold + config.getSevereAboveTerrain()) rules.add("SEVERE_TERRAIN_EXCEEDANCE");
            if (heatIndex >= config.getSevereHeatIndex()) rules.add("SEVERE_HEAT_INDEX");
            if (severePersistence) rules.add("CRITICAL_ZONE_MULTI_DAY_WARM_NIGHT_PERSISTENCE");
        } else if ((max >= terrainThreshold && (departure >= config.getWarningDeparture() || hotDays >= 2))
                || heatIndex >= config.getWarningHeatIndex()) {
            status = AlertStatus.HEATWAVE_WARNING;
            if (max >= terrainThreshold) rules.add("TERRAIN_THRESHOLD_REACHED");
            if (departure >= config.getWarningDeparture()) rules.add("SIGNIFICANT_TEMPERATURE_DEPARTURE");
            if (hotDays >= 2) rules.add("MULTI_DAY_HEAT_PERSISTENCE");
            if (heatIndex >= config.getWarningHeatIndex()) rules.add("HIGH_APPARENT_TEMPERATURE");
        } else if (max >= terrainThreshold - config.getWatchNearThreshold()
                || (departure >= config.getWatchDepartureMin() && departure <= config.getWatchDepartureMax())
                || (heatIndex >= config.getWatchHeatIndexMin() && heatIndex <= config.getWatchHeatIndexMax())) {
            status = AlertStatus.HEAT_WATCH_CAUTION;
            if (max >= terrainThreshold - config.getWatchNearThreshold()) rules.add("NEAR_TERRAIN_THRESHOLD");
            if (departure >= config.getWatchDepartureMin() && departure <= config.getWatchDepartureMax()) rules.add("MODERATE_TEMPERATURE_DEPARTURE");
            if (heatIndex >= config.getWatchHeatIndexMin() && heatIndex <= config.getWatchHeatIndexMax()) rules.add("ELEVATED_APPARENT_TEMPERATURE");
        } else {
            status = AlertStatus.NORMAL_CONDITIONS;
            rules.add("BELOW_WATCH_THRESHOLDS");
        }

        result.setAlertStatus(status);
        result.setAppliedRules(rules);
        result.setReasoning(buildExplanation(status, max, min, humidity, baseline, heatIndex, departure,
                terrainThreshold, hotDays, warmNight, zone.getVulnerabilityLevel(), region.getTerrainType().name(), rules));
        result.setSectorActions(sectorActions(status, zone));

        if (status == AlertStatus.NORMAL_CONDITIONS) {
            result.setOutdoorRestrictionHours(0);
            result.setCoolingCenterOperatingHours(0);
            result.setEstimatedGridDemandSurgePercent(0.0);
            result.setPeakExposureWindow("No additional restriction recommended by this prototype.");
            result.setNextEvaluationAt(evaluatedAt.plusSeconds(48 * 3600L));
        } else {
            int vulnerabilityWeight = switch (zone.getVulnerabilityLevel()) {
                case LOW -> 0;
                case MODERATE -> 1;
                case HIGH -> 2;
                case CRITICAL -> 3;
            };
            double uvFactor = observation.getUvIndex() == null ? 0.0 : observation.getUvIndex() * 0.08;
            double landUseWeight = switch (zone.getLandUseType()) {
                case HIGH_DENSITY_URBAN -> 1.0;
                case INDUSTRIAL_BELT -> 1.0;
                case SEMI_URBAN -> 0.5;
                case RURAL_AGRICULTURAL -> 0.3;
                case GREEN_PERI_URBAN -> 0.0;
            };
            int restriction = (int) Math.round(clamp(2.0 + Math.max(0, heatIndex - 38.0) * 0.30
                    + vulnerabilityWeight * 0.45 + landUseWeight * 0.35 + uvFactor, 2.0, 6.0));
            int coolingHours = (int) Math.round(clamp(3.0 + Math.max(0, departure) * 0.65
                    + (warmNight ? 2.0 : 0.0) + vulnerabilityWeight, 3.0, 16.0));
            double gridSurge = round2(clamp(Math.max(0, departure) * 3.0
                    + Math.max(0, heatIndex - 38.0) * 1.5
                    + (warmNight ? 10.0 : 0.0) + landUseWeight * 2.0
                    + (zone.getEstimatedPopulation() == null ? 0 : zone.getEstimatedPopulation() / 100000.0 * 2.0), 0.0, 75.0));
            result.setOutdoorRestrictionHours(restriction);
            result.setCoolingCenterOperatingHours(coolingHours);
            result.setEstimatedGridDemandSurgePercent(gridSurge);
            result.setPeakExposureWindow("11:00 AM – 4:00 PM peak-risk window; apply approximately " + restriction + " hours of outdoor-work restriction or rescheduling.");
            int hours = status == AlertStatus.SEVERE_HEATWAVE_EMERGENCY ? 6
                    : status == AlertStatus.HEATWAVE_WARNING ? 12 : 24;
            result.setNextEvaluationAt(evaluatedAt.plusSeconds(hours * 3600L));
        }
        return result;
    }

    /** Simplified apparent-temperature estimate for a teaching prototype; not an official Heat Index implementation. */
    public double calculateHeatIndex(double maxTemperatureC, double relativeHumidity) {
        if (maxTemperatureC < 27.0) return maxTemperatureC;
        double humidityAmplification = Math.max(0.0, relativeHumidity - 40.0) * 0.10;
        double temperatureAmplification = Math.max(0.0, maxTemperatureC - 27.0) * 0.32;
        return maxTemperatureC + humidityAmplification + temperatureAmplification;
    }

    private String buildExplanation(AlertStatus status, double max, double min, double humidity,
                                    double baseline, double heatIndex, double departure,
                                    double terrainThreshold, int hotDays, boolean warmNight,
                                    VulnerabilityLevel vulnerability, String terrainName, List<String> rules) {
        String prefix = String.format(Locale.ROOT, "Recorded maximum temperature %.1f°C and minimum temperature %.1f°C, with relative humidity %.0f%%. ", max, min, humidity);
        String metrics = String.format(Locale.ROOT, "The estimated Heat Index is %.1f°C; the maximum-temperature departure from the zone baseline (%.1f°C) is %+.1f°C. The %s terrain threshold is %.1f°C. ",
                heatIndex, baseline, departure, terrainName, terrainThreshold);
        String persistence = String.format(Locale.ROOT, "There have been %d consecutive hot day(s); %s. The zone vulnerability level is %s. ",
                hotDays, warmNight ? "the warm night (minimum ≥ 28°C) indicates reduced nocturnal recovery" : "the minimum temperature is below the warm-night marker", vulnerability);
        String decision = switch (status) {
            case SEVERE_HEATWAVE_EMERGENCY -> "A Severe Heatwave Emergency is issued because one or more extreme-temperature, extreme apparent-temperature, or critical-zone persistence rules were met.";
            case HEATWAVE_WARNING -> "A Heatwave Warning is issued because the terrain threshold and significant departure/persistence criteria or the high Heat Index criterion were met.";
            case HEAT_WATCH_CAUTION -> "A Heat Watch / Caution is issued because the observation is close to the terrain threshold or has a moderate anomaly/apparent-temperature elevation.";
            case NORMAL_CONDITIONS -> "Normal Conditions are assigned because the observation remains below the configured watch, warning, and emergency criteria.";
            case REVIEW_REQUIRED -> "Manual review is required before classifying this observation.";
        };
        return prefix + metrics + persistence + decision + " Applied rules: " + String.join(", ", rules) + ".";
    }

    private Map<String, Object> snapshot(WeatherObservationDocument o, MonitoringZoneDocument z) {
        Map<String, Object> values = new LinkedHashMap<>();
        values.put("observedAt", o.getObservedAt());
        values.put("maxTemperature", o.getMaxTemperature());
        values.put("minTemperature", o.getMinTemperature());
        values.put("relativeHumidity", o.getRelativeHumidity());
        values.put("windSpeedKmh", o.getWindSpeedKmh());
        values.put("consecutiveHotDays", o.getConsecutiveHotDays());
        values.put("uvIndex", o.getUvIndex());
        values.put("baselineMaxTemperature", z.getBaselineMaxTemperature());
        values.put("landUseType", z.getLandUseType());
        values.put("vulnerabilityLevel", z.getVulnerabilityLevel());
        values.put("estimatedPopulation", z.getEstimatedPopulation());
        return values;
    }

    private Map<String, List<String>> sectorActions(AlertStatus status, MonitoringZoneDocument zone) {
        Map<String, List<String>> actions = new LinkedHashMap<>();
        if (status == AlertStatus.REVIEW_REQUIRED) {
            actions.put("Public Health", List.of("Verify the entered observation and historical baseline before publishing a public notice."));
            actions.put("Outdoor Labor", List.of("Do not infer work restrictions from an incomplete record; obtain a verified observation."));
            actions.put("Water & Power Grid", List.of("Review local conditions and confirm source data."));
        } else if (status == AlertStatus.NORMAL_CONDITIONS) {
            actions.put("Public Health", List.of("Continue routine heat-health awareness and maintain drinking-water access."));
            actions.put("Outdoor Labor", List.of("Continue standard occupational heat-safety practices and hydration breaks."));
            actions.put("Water & Power Grid", List.of("Continue routine monitoring of water supply and electricity demand."));
        } else if (status == AlertStatus.HEAT_WATCH_CAUTION) {
            actions.put("Public Health", List.of("Share hydration and heat-illness symptom guidance with residents.", "Check on older adults and people with limited access to cooling."));
            actions.put("Outdoor Labor", List.of("Move strenuous work away from the hottest afternoon period where feasible.", "Provide shaded rest and drinking water."));
            actions.put("Water & Power Grid", List.of("Check water points and local transformer loading; prepare cooling locations."));
        } else if (status == AlertStatus.HEATWAVE_WARNING) {
            actions.put("Public Health", List.of("Issue a ward-level heat-health notice and prepare nearby health facilities.", "Activate available public cooling centres and drinking-water stations."));
            actions.put("Outdoor Labor", List.of("Reschedule strenuous outdoor work outside the peak exposure window.", "Enforce frequent shaded rest, water breaks, and supervisor checks."));
            actions.put("Water & Power Grid", List.of("Increase water-supply checks and monitor evening electricity demand.", "Prepare backup power for priority cooling and health facilities."));
        } else {
            actions.put("Public Health", List.of("Activate the local heat emergency response and issue an urgent public warning.", "Open cooling centres, deploy water distribution, and check on high-risk residents."));
            actions.put("Outdoor Labor", List.of("Suspend or defer non-essential strenuous outdoor work during the hottest hours.", "Deploy supervisors to monitor workers for heat illness and ensure rapid medical referral."));
            actions.put("Water & Power Grid", List.of("Extend cooling-centre operations and prioritize water supply to vulnerable locations.", "Coordinate grid-load monitoring and contingency power for emergency services."));
        }
        if (zone.getCoolingInfrastructure() == CoolingInfrastructure.STANDARD_GRID_ONLY && status != AlertStatus.NORMAL_CONDITIONS && status != AlertStatus.REVIEW_REQUIRED) {
            actions.put("Public Health", new ArrayList<>(actions.get("Public Health")));
            actions.get("Public Health").add("Identify temporary shaded public spaces because dedicated cooling infrastructure is limited.");
        }
        return actions;
    }

    private double clamp(double value, double min, double max) { return Math.max(min, Math.min(max, value)); }
    private double round2(double value) { return Math.round(value * 100.0) / 100.0; }
}
