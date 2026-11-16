package com.example.heatwaveadvisory.service;

import com.example.heatwaveadvisory.document.MonitoringZoneDocument;
import com.example.heatwaveadvisory.document.WeatherObservationDocument;
import com.example.heatwaveadvisory.exception.ConflictException;
import com.example.heatwaveadvisory.exception.ResourceNotFoundException;
import com.example.heatwaveadvisory.repository.HeatwaveAdvisoryRepository;
import com.example.heatwaveadvisory.repository.WeatherObservationRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ObservationService {
    private final WeatherObservationRepository observations;
    private final HeatwaveAdvisoryRepository advisories;
    private final ZoneService zones;

    public ObservationService(WeatherObservationRepository observations, HeatwaveAdvisoryRepository advisories, ZoneService zones) {
        this.observations = observations;
        this.advisories = advisories;
        this.zones = zones;
    }

    public List<WeatherObservationDocument> list(String zoneId) {
        return zoneId == null || zoneId.isBlank()
                ? observations.findAllByOrderByObservedAtDesc()
                : observations.findByZoneIdOrderByObservedAtDesc(zoneId);
    }

    public WeatherObservationDocument get(String id) {
        return observations.findById(id).orElseThrow(() -> new ResourceNotFoundException("Observation not found: " + id));
    }

    public WeatherObservationDocument create(WeatherObservationDocument input) {
        zones.find(input.getZoneId());
        validate(input);
        input.setId(null);
        input.setCreatedAt(Instant.now());
        return observations.save(input);
    }

    public WeatherObservationDocument update(String id, WeatherObservationDocument input) {
        WeatherObservationDocument existing = get(id);
        zones.find(input.getZoneId());
        validate(input);
        existing.setZoneId(input.getZoneId());
        existing.setObservedAt(input.getObservedAt());
        existing.setMaxTemperature(input.getMaxTemperature());
        existing.setMinTemperature(input.getMinTemperature());
        existing.setRelativeHumidity(input.getRelativeHumidity());
        existing.setWindSpeedKmh(input.getWindSpeedKmh());
        existing.setConsecutiveHotDays(input.getConsecutiveHotDays());
        existing.setUvIndex(input.getUvIndex());
        existing.setSolarRadiationNotes(input.getSolarRadiationNotes());
        existing.setFieldNotes(input.getFieldNotes());
        return observations.save(existing);
    }

    public void delete(String id) {
        WeatherObservationDocument existing = get(id);
        if (advisories.existsByObservationId(id)) throw new ConflictException("An advisory has already been generated from this observation. It cannot be deleted because the advisory references it.");
        observations.delete(existing);
    }

    private void validate(WeatherObservationDocument input) {
        if (input.getMaxTemperature() == null || input.getMinTemperature() == null || input.getRelativeHumidity() == null) {
            throw new IllegalArgumentException("Maximum temperature, minimum temperature, and relative humidity are required.");
        }
        if (input.getMinTemperature() > input.getMaxTemperature()) {
            throw new IllegalArgumentException("Minimum (nighttime) temperature must be less than or equal to maximum temperature.");
        }
        if (input.getObservedAt() == null) throw new IllegalArgumentException("Observation date and time are required.");
        if (input.getObservedAt().isAfter(Instant.now().plusSeconds(60))) throw new IllegalArgumentException("Observation time cannot be in the future.");
    }
}
