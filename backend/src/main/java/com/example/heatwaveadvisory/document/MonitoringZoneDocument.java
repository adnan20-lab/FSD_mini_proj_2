package com.example.heatwaveadvisory.document;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document("monitoring_zones")
public class MonitoringZoneDocument {
    @Id private String id;
    @NotBlank private String name;
    @NotBlank private String regionId;
    @NotNull @Positive private Long estimatedPopulation;
    @NotNull @Positive @DecimalMax("100000.0") private Double areaSqKm;
    @NotNull private LandUseType landUseType;
    @NotNull private VulnerabilityLevel vulnerabilityLevel;
    @NotNull @DecimalMin("15.0") @DecimalMax("50.0") private Double baselineMaxTemperature;
    @NotNull private CoolingInfrastructure coolingInfrastructure;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
