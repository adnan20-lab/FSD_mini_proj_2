package com.example.heatwaveadvisory.document;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document("weather_observations")
public class WeatherObservationDocument {
    @Id private String id;
    @NotBlank private String zoneId;
    @NotNull private Instant observedAt;
    @NotNull @DecimalMin("-10.0") @DecimalMax("60.0") private Double maxTemperature;
    @NotNull @DecimalMin("-15.0") @DecimalMax("60.0") private Double minTemperature;
    @NotNull @DecimalMin("0.0") @DecimalMax("100.0") private Double relativeHumidity;
    @NotNull @DecimalMin("0.0") @DecimalMax("200.0") private Double windSpeedKmh;
    @NotNull @Min(0) @Max(90) private Integer consecutiveHotDays;
    @DecimalMin("0.0") @DecimalMax("15.0") private Double uvIndex;
    private String solarRadiationNotes;
    private String fieldNotes;
    private Instant createdAt;
}
