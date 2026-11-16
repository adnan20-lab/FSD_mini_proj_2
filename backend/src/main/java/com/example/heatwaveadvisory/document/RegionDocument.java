package com.example.heatwaveadvisory.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@Document("regions")
public class RegionDocument {
    @Id private String id;
    @NotBlank private String name;
    @NotBlank private String nodalOfficer;
    @NotBlank @Pattern(regexp = "^(?=.*\\d)[+0-9() .-]{7,24}$", message = "Enter a valid contact number") private String emergencyContact;
    @NotBlank private String state;
    @NotNull private TerrainType terrainType;
    private String notes;
    private Instant createdAt;
}
