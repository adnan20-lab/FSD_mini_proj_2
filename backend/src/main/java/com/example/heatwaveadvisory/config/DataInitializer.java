package com.example.heatwaveadvisory.config;

import com.example.heatwaveadvisory.document.*;
import com.example.heatwaveadvisory.repository.RegionRepository;
import com.example.heatwaveadvisory.service.AdvisoryService;
import com.example.heatwaveadvisory.service.ObservationService;
import com.example.heatwaveadvisory.service.RegionService;
import com.example.heatwaveadvisory.service.ZoneService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@ConditionalOnProperty(prefix = "heatwave.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements ApplicationRunner {
    private final RegionRepository regionRepository;
    private final RegionService regions;
    private final ZoneService zones;
    private final ObservationService observations;
    private final AdvisoryService advisories;

    public DataInitializer(RegionRepository regionRepository, RegionService regions, ZoneService zones,
                           ObservationService observations, AdvisoryService advisories) {
        this.regionRepository = regionRepository;
        this.regions = regions;
        this.zones = zones;
        this.observations = observations;
        this.advisories = advisories;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (regionRepository.count() > 0) return;

        RegionDocument plains = region("Vidarbha Plains Authority", "Dr. Meera Kulkarni", "+91 712 555 0101", "Maharashtra", TerrainType.PLAINS,
                "Inland plains demonstration region with high pre-monsoon temperatures.");
        RegionDocument coastal = region("Konkan Coastal Municipality", "Arun Deshmukh", "+91 22 5550 0102", "Maharashtra", TerrainType.COASTAL,
                "Coastal humidity demonstration region.");
        RegionDocument hills = region("Western Ghats Hill Council", "Sana Patil", "+91 2352 555 103", "Maharashtra", TerrainType.HILLY,
                "Elevated terrain demonstration region.");
        plains = regions.create(plains);
        coastal = regions.create(coastal);
        hills = regions.create(hills);

        MonitoringZoneDocument nagpur = zone("Nagpur Central Ward", plains.getId(), 185000L, 12.4, LandUseType.HIGH_DENSITY_URBAN,
                VulnerabilityLevel.CRITICAL, 37.5, CoolingInfrastructure.PUBLIC_COOLING_CENTERS, "Dense urban core and outdoor commuter activity.");
        MonitoringZoneDocument amravati = zone("Amravati Industrial Belt", plains.getId(), 94000L, 18.2, LandUseType.INDUSTRIAL_BELT,
                VulnerabilityLevel.HIGH, 37.5, CoolingInfrastructure.SHADED_TRANSIT_HUBS, "Industrial and logistics workforce exposure.");
        MonitoringZoneDocument mumbai = zone("Mumbai East Ward", coastal.getId(), 210000L, 9.8, LandUseType.HIGH_DENSITY_URBAN,
                VulnerabilityLevel.CRITICAL, 32.5, CoolingInfrastructure.MIST_STATIONS, "High density and coastal humidity.");
        MonitoringZoneDocument ratnagiri = zone("Ratnagiri South Ward", coastal.getId(), 48000L, 24.0, LandUseType.SEMI_URBAN,
                VulnerabilityLevel.MODERATE, 33.0, CoolingInfrastructure.PUBLIC_COOLING_CENTERS, "Mixed residential and coastal settlement.");
        MonitoringZoneDocument mahabaleshwar = zone("Mahabaleshwar Ridge", hills.getId(), 16000L, 14.6, LandUseType.GREEN_PERI_URBAN,
                VulnerabilityLevel.LOW, 28.0, CoolingInfrastructure.STANDARD_GRID_ONLY, "Hill settlement with comparatively lower baseline temperatures.");

        nagpur = zones.create(nagpur).zone();
        amravati = zones.create(amravati).zone();
        mumbai = zones.create(mumbai).zone();
        ratnagiri = zones.create(ratnagiri).zone();
        mahabaleshwar = zones.create(mahabaleshwar).zone();

        seedObservation(nagpur, 46.0, 31.0, 55.0, 13.0, 4, 10.0, 2);
        seedObservation(amravati, 42.5, 28.0, 45.0, 9.0, 2, 8.0, 5);
        seedObservation(mumbai, 35.0, 27.0, 68.0, 14.0, 1, 7.0, 8);
        seedObservation(ratnagiri, 31.8, 22.0, 50.0, 11.0, 0, 5.0, 11);
        seedObservation(mahabaleshwar, 31.5, 22.0, 45.0, 8.0, 1, 6.0, 14);
    }

    private RegionDocument region(String name, String officer, String phone, String state, TerrainType terrain, String notes) {
        RegionDocument value = new RegionDocument();
        value.setName(name); value.setNodalOfficer(officer); value.setEmergencyContact(phone);
        value.setState(state); value.setTerrainType(terrain); value.setNotes(notes);
        return value;
    }

    private MonitoringZoneDocument zone(String name, String regionId, long population, double area,
                                          LandUseType landUse, VulnerabilityLevel vulnerability,
                                          double baseline, CoolingInfrastructure cooling, String notes) {
        MonitoringZoneDocument value = new MonitoringZoneDocument();
        value.setName(name); value.setRegionId(regionId); value.setEstimatedPopulation(population);
        value.setAreaSqKm(area); value.setLandUseType(landUse); value.setVulnerabilityLevel(vulnerability);
        value.setBaselineMaxTemperature(baseline); value.setCoolingInfrastructure(cooling); value.setNotes(notes);
        return value;
    }

    private void seedObservation(MonitoringZoneDocument zone, double max, double min, double humidity,
                                 double wind, int hotDays, double uv, int hoursAgo) {
        WeatherObservationDocument value = new WeatherObservationDocument();
        value.setZoneId(zone.getId()); value.setObservedAt(Instant.now().minusSeconds(hoursAgo * 3600L));
        value.setMaxTemperature(max); value.setMinTemperature(min); value.setRelativeHumidity(humidity);
        value.setWindSpeedKmh(wind); value.setConsecutiveHotDays(hotDays); value.setUvIndex(uv);
        value.setSolarRadiationNotes("Sample manually entered UV/radiation note for academic demonstration.");
        value.setFieldNotes("Seed scenario — synthetic educational data, not a real weather report.");
        WeatherObservationDocument saved = observations.create(value);
        advisories.generate(saved.getId());
    }
}
