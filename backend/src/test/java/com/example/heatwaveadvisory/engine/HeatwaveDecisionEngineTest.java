package com.example.heatwaveadvisory.engine;

import com.example.heatwaveadvisory.config.HeatwaveModelConfig;
import com.example.heatwaveadvisory.document.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class HeatwaveDecisionEngineTest {
    private HeatwaveDecisionEngine engine;

    @BeforeEach
    void setUp() { engine = new HeatwaveDecisionEngine(new HeatwaveModelConfig()); }

    @Test
    void classifiesSevereEmergencyForExtremeAbsoluteTemperature() {
        var result = engine.evaluate(observation(45.0, 30.0, 45.0, 3), zone(VulnerabilityLevel.HIGH, 37.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.SEVERE_HEATWAVE_EMERGENCY, result.getAlertStatus());
        assertTrue(result.getAppliedRules().contains("SEVERE_ABSOLUTE_TEMPERATURE"));
    }

    @Test
    void classifiesWarningForTerrainThresholdAndDeparture() {
        var result = engine.evaluate(observation(42.0, 25.0, 40.0, 0), zone(VulnerabilityLevel.MODERATE, 37.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.HEATWAVE_WARNING, result.getAlertStatus());
        assertTrue(result.getTemperatureDeparture() >= 4.5);
    }

    @Test
    void classifiesWatchWhenTemperatureIsNearTerrainThreshold() {
        var result = engine.evaluate(observation(38.0, 24.0, 40.0, 0), zone(VulnerabilityLevel.LOW, 36.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.HEAT_WATCH_CAUTION, result.getAlertStatus());
    }

    @Test
    void classifiesNormalWhenAllMetricsAreBelowWatchThresholds() {
        var result = engine.evaluate(observation(31.0, 20.0, 35.0, 0), zone(VulnerabilityLevel.LOW, 35.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.NORMAL_CONDITIONS, result.getAlertStatus());
        assertEquals(0, result.getOutdoorRestrictionHours());
        assertEquals(0, result.getCoolingCenterOperatingHours());
    }

    @Test
    void returnsReviewRequiredForMissingOrInconsistentInputs() {
        WeatherObservationDocument invalid = observation(35.0, 20.0, 40.0, 0);
        invalid.setMinTemperature(null);
        var result = engine.evaluate(invalid, zone(VulnerabilityLevel.LOW, 34.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.REVIEW_REQUIRED, result.getAlertStatus());
        assertNull(result.getOutdoorRestrictionHours());
        assertNull(result.getNextEvaluationAt());
    }

    @Test
    void returnsReviewRequiredForOutOfRangePersistedHumidity() {
        WeatherObservationDocument invalid = observation(35.0, 20.0, 40.0, 0);
        invalid.setRelativeHumidity(105.0);
        var result = engine.evaluate(invalid, zone(VulnerabilityLevel.LOW, 34.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.REVIEW_REQUIRED, result.getAlertStatus());
        assertNull(result.getHeatIndex());
        assertNull(result.getTemperatureDeparture());
    }

    @Test
    void nextReviewTimeIsMeasuredFromAdvisoryGenerationNotOldObservationTime() {
        WeatherObservationDocument oldObservation = observation(31.0, 20.0, 35.0, 0);
        oldObservation.setObservedAt(Instant.now().minusSeconds(72 * 3600L));
        Instant beforeEvaluation = Instant.now();
        var result = engine.evaluate(oldObservation, zone(VulnerabilityLevel.LOW, 35.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.NORMAL_CONDITIONS, result.getAlertStatus());
        assertTrue(result.getNextEvaluationAt().isAfter(beforeEvaluation.plusSeconds(47 * 3600L)));
    }

    @Test
    void severePriorityOverridesWarningAndWatchCriteria() {
        var result = engine.evaluate(observation(46.0, 31.0, 55.0, 4), zone(VulnerabilityLevel.CRITICAL, 37.5), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.SEVERE_HEATWAVE_EMERGENCY, result.getAlertStatus());
    }

    @Test
    void criticalZoneWithThreeHotDaysAndWarmNightTriggersEmergency() {
        var result = engine.evaluate(observation(41.0, 30.0, 42.0, 3), zone(VulnerabilityLevel.CRITICAL, 38.0), region(TerrainType.PLAINS));
        assertEquals(AlertStatus.SEVERE_HEATWAVE_EMERGENCY, result.getAlertStatus());
        assertTrue(result.getAppliedRules().contains("CRITICAL_ZONE_MULTI_DAY_WARM_NIGHT_PERSISTENCE"));
    }

    @Test
    void heatIndexUsesSimplifiedFormulaOnlyAboveTwentySevenC() {
        assertEquals(25.0, engine.calculateHeatIndex(25.0, 90.0), 0.001);
        assertEquals(42.0 + 1.0 + 4.8, engine.calculateHeatIndex(42.0, 50.0), 0.001);
    }

    private WeatherObservationDocument observation(double max, double min, double humidity, int days) {
        WeatherObservationDocument value = new WeatherObservationDocument();
        value.setId("obs-test"); value.setZoneId("zone-test"); value.setObservedAt(Instant.now());
        value.setMaxTemperature(max); value.setMinTemperature(min); value.setRelativeHumidity(humidity);
        value.setWindSpeedKmh(8.0); value.setConsecutiveHotDays(days); value.setUvIndex(7.0);
        return value;
    }

    private MonitoringZoneDocument zone(VulnerabilityLevel vulnerability, double baseline) {
        MonitoringZoneDocument value = new MonitoringZoneDocument();
        value.setId("zone-test"); value.setName("Test Zone"); value.setRegionId("region-test");
        value.setEstimatedPopulation(50000L); value.setAreaSqKm(10.0); value.setLandUseType(LandUseType.HIGH_DENSITY_URBAN);
        value.setVulnerabilityLevel(vulnerability); value.setBaselineMaxTemperature(baseline);
        value.setCoolingInfrastructure(CoolingInfrastructure.PUBLIC_COOLING_CENTERS);
        return value;
    }

    private RegionDocument region(TerrainType terrain) {
        RegionDocument value = new RegionDocument();
        value.setId("region-test"); value.setName("Test Region"); value.setTerrainType(terrain);
        return value;
    }
}
