package com.example.heatwaveadvisory.service;

import com.example.heatwaveadvisory.document.RegionDocument;
import com.example.heatwaveadvisory.exception.ConflictException;
import com.example.heatwaveadvisory.exception.ResourceNotFoundException;
import com.example.heatwaveadvisory.repository.MonitoringZoneRepository;
import com.example.heatwaveadvisory.repository.RegionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class RegionService {
    private final RegionRepository regions;
    private final MonitoringZoneRepository zones;

    public RegionService(RegionRepository regions, MonitoringZoneRepository zones) {
        this.regions = regions;
        this.zones = zones;
    }

    public List<RegionDocument> list(String q) {
        List<RegionDocument> all = regions.findAll();
        if (q == null || q.isBlank()) return all;
        String needle = q.toLowerCase(Locale.ROOT);
        return all.stream().filter(r -> contains(r.getName(), needle)
                || contains(r.getState(), needle) || contains(r.getNodalOfficer(), needle)).toList();
    }

    public RegionDocument get(String id) {
        return regions.findById(id).orElseThrow(() -> new ResourceNotFoundException("Region not found: " + id));
    }

    public RegionDocument create(RegionDocument input) {
        input.setId(null);
        input.setCreatedAt(Instant.now());
        return regions.save(input);
    }

    public RegionDocument update(String id, RegionDocument input) {
        RegionDocument existing = get(id);
        existing.setName(input.getName());
        existing.setNodalOfficer(input.getNodalOfficer());
        existing.setEmergencyContact(input.getEmergencyContact());
        existing.setState(input.getState());
        existing.setTerrainType(input.getTerrainType());
        existing.setNotes(input.getNotes());
        return regions.save(existing);
    }

    public void delete(String id) {
        RegionDocument existing = get(id);
        if (!zones.findByRegionId(id).isEmpty()) {
            throw new ConflictException("This region still has monitoring zones. Delete or reassign its zones before deleting the region.");
        }
        regions.delete(existing);
    }

    private boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }
}
