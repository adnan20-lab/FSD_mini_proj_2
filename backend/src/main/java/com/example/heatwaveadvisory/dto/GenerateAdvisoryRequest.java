package com.example.heatwaveadvisory.dto;

import jakarta.validation.constraints.NotBlank;

public record GenerateAdvisoryRequest(@NotBlank String observationId) { }
