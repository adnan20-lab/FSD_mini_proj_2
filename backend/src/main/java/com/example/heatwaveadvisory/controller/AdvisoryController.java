package com.example.heatwaveadvisory.controller;

import com.example.heatwaveadvisory.document.HeatwaveAdvisoryDocument;
import com.example.heatwaveadvisory.dto.GenerateAdvisoryRequest;
import com.example.heatwaveadvisory.service.AdvisoryService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/advisories")
@SecurityRequirement(name = "bearerAuth")
public class AdvisoryController {
    private final AdvisoryService advisories;
    public AdvisoryController(AdvisoryService advisories) { this.advisories = advisories; }

    @PostMapping("/generate") @ResponseStatus(HttpStatus.CREATED)
    public HeatwaveAdvisoryDocument generate(@Valid @RequestBody GenerateAdvisoryRequest input) { return advisories.generate(input.observationId()); }

    @GetMapping public List<HeatwaveAdvisoryDocument> list(@RequestParam(required = false) String zoneId,
                                                            @RequestParam(required = false) String alertStatus,
                                                            @RequestParam(required = false) Boolean acknowledged,
                                                            @RequestParam(required = false) Instant from,
                                                            @RequestParam(required = false) Instant to) {
        return advisories.list(zoneId, alertStatus, acknowledged, from, to);
    }

    @GetMapping("/{id}") public HeatwaveAdvisoryDocument get(@PathVariable String id) { return advisories.get(id); }

    @PatchMapping("/{id}/acknowledge") public HeatwaveAdvisoryDocument acknowledge(
            @PathVariable String id, @RequestParam(required = false, defaultValue = "Civic Authority") String acknowledgedBy) {
        return advisories.acknowledge(id, acknowledgedBy);
    }
}
