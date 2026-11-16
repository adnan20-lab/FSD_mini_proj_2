package com.example.heatwaveadvisory.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(min = 4, max = 32)
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Use letters, numbers, dot, underscore or hyphen only")
        String username,
        @NotBlank @Size(min = 10, max = 72, message = "Password must be between 10 and 72 characters")
        String password
) { }
