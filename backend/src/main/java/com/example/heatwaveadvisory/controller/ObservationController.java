package com.example.heatwaveadvisory.controller;

import com.example.heatwaveadvisory.document.WeatherObservationDocument;
import com.example.heatwaveadvisory.service.ObservationService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/observations")
@SecurityRequirement(name = "bearerAuth")
public class ObservationController {
    private final ObservationService observations;
    public ObservationController(ObservationService observations) { this.observations = observations; }

    @GetMapping public List<WeatherObservationDocument> list(@RequestParam(required = false) String zoneId) { return observations.list(zoneId); }
    @GetMapping("/{id}") public WeatherObservationDocument get(@PathVariable String id) { return observations.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public WeatherObservationDocument create(@Valid @RequestBody WeatherObservationDocument input) { return observations.create(input); }
    @PutMapping("/{id}") public WeatherObservationDocument update(@PathVariable String id, @Valid @RequestBody WeatherObservationDocument input) { return observations.update(id, input); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable String id) { observations.delete(id); }
}
