package com.example.heatwaveadvisory.controller;

import com.example.heatwaveadvisory.document.RegionDocument;
import com.example.heatwaveadvisory.dto.ZoneResponse;
import com.example.heatwaveadvisory.service.RegionService;
import com.example.heatwaveadvisory.service.ZoneService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@SecurityRequirement(name = "bearerAuth")
public class RegionController {
    private final RegionService regions;
    private final ZoneService zones;

    public RegionController(RegionService regions, ZoneService zones) { this.regions = regions; this.zones = zones; }

    @GetMapping public List<RegionDocument> list(@RequestParam(required = false) String q) { return regions.list(q); }
    @GetMapping("/{id}") public RegionDocument get(@PathVariable String id) { return regions.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public RegionDocument create(@Valid @RequestBody RegionDocument input) { return regions.create(input); }
    @PutMapping("/{id}") public RegionDocument update(@PathVariable String id, @Valid @RequestBody RegionDocument input) { return regions.update(id, input); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable String id) { regions.delete(id); }
    @GetMapping("/{id}/zones") public List<ZoneResponse> zones(@PathVariable String id) { return zones.byRegion(id); }
}
