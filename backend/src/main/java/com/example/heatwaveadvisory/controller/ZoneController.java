package com.example.heatwaveadvisory.controller;

import com.example.heatwaveadvisory.document.MonitoringZoneDocument;
import com.example.heatwaveadvisory.dto.ZoneResponse;
import com.example.heatwaveadvisory.service.ZoneService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@SecurityRequirement(name = "bearerAuth")
public class ZoneController {
    private final ZoneService zones;
    public ZoneController(ZoneService zones) { this.zones = zones; }

    @GetMapping public List<ZoneResponse> list(@RequestParam(required = false) String regionId,
                                                @RequestParam(required = false) String landUseType,
                                                @RequestParam(required = false) String vulnerabilityLevel,
                                                @RequestParam(required = false) String alertStatus) {
        return zones.list(regionId, landUseType, vulnerabilityLevel, alertStatus);
    }
    @GetMapping("/{id}") public ZoneResponse get(@PathVariable String id) { return zones.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ZoneResponse create(@Valid @RequestBody MonitoringZoneDocument input) { return zones.create(input); }
    @PutMapping("/{id}") public ZoneResponse update(@PathVariable String id, @Valid @RequestBody MonitoringZoneDocument input) { return zones.update(id, input); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable String id) { zones.delete(id); }
}
