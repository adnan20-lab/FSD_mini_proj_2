package com.example.heatwaveadvisory.document;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@Document("heatwave_advisories")
public class HeatwaveAdvisoryDocument {
    @Id private String id;
    private String zoneId;
    private String zoneNameSnapshot;
    private String regionId;
    private String regionNameSnapshot;
    private String observationId;
    private Instant observationAt;
    private AlertStatus alertStatus;
    private String reasoning;
    private Map<String, Object> inputSnapshot;
    private Double heatIndex;
    private Double temperatureDeparture;
    private Double terrainThreshold;
    private boolean warmNightConcern;
    private Integer consecutiveHotDays;
    private Integer outdoorRestrictionHours;
    private Integer coolingCenterOperatingHours;
    private Double estimatedGridDemandSurgePercent;
    private String peakExposureWindow;
    private Instant nextEvaluationAt;
    private Instant createdAt;
    private String modelVersion;
    private AcknowledgementStatus acknowledgementStatus;
    private Instant acknowledgedAt;
    private String acknowledgedBy;
    private List<String> appliedRules = new ArrayList<>();
    private Map<String, List<String>> sectorActions;
}
