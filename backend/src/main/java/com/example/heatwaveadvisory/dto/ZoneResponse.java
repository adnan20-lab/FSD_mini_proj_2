package com.example.heatwaveadvisory.dto;

import com.example.heatwaveadvisory.document.HeatwaveAdvisoryDocument;
import com.example.heatwaveadvisory.document.MonitoringZoneDocument;
import com.example.heatwaveadvisory.document.WeatherObservationDocument;

public record ZoneResponse(
        MonitoringZoneDocument zone,
        String regionName,
        String terrainType,
        WeatherObservationDocument latestObservation,
        HeatwaveAdvisoryDocument latestAdvisory
) { }
