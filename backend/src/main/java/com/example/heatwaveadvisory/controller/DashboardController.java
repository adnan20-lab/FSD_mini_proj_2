package com.example.heatwaveadvisory.controller;

import com.example.heatwaveadvisory.dto.DashboardSummary;
import com.example.heatwaveadvisory.dto.ModelConfigResponse;
import com.example.heatwaveadvisory.service.DashboardService;
import com.example.heatwaveadvisory.config.HeatwaveModelConfig;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.bson.Document;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api")
public class DashboardController {
    private final DashboardService dashboard;
    private final MongoTemplate mongoTemplate;
    private final HeatwaveModelConfig config;

    public DashboardController(DashboardService dashboard, MongoTemplate mongoTemplate, HeatwaveModelConfig config) {
        this.dashboard = dashboard; this.mongoTemplate = mongoTemplate; this.config = config;
    }

    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/dashboard/summary") public DashboardSummary summary() { return dashboard.summary(); }

    @GetMapping("/health") public Object health() {
        boolean databaseConnected;
        try { mongoTemplate.executeCommand(new Document("ping", 1)); databaseConnected = true; }
        catch (Exception ex) { databaseConnected = false; }
        return new HealthResponse("UP", databaseConnected ? "CONNECTED" : "DISCONNECTED", Instant.now());
    }

    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/model/config") public ModelConfigResponse modelConfig() {
        return new ModelConfigResponse(config.getVersion(), config.getTerrainThresholds(),
                config.getSevereAbsoluteTemperature(), config.getSevereAboveTerrain(), config.getSevereHeatIndex(),
                config.getWarningDeparture(), config.getWarningHeatIndex(), config.getWatchNearThreshold(),
                config.getWatchDepartureMin(), config.getWatchDepartureMax(), config.getWatchHeatIndexMin(),
                config.getWatchHeatIndexMax(),
                "For maxTemp >= 27°C: HI = maxTemp + max(0, RH-40)×0.10 + max(0, maxTemp-27)×0.32; otherwise HI = maxTemp.",
                "Academic decision-support prototype only. Calibrate with IMD and public-health authorities before real-world use.");
    }

    public record HealthResponse(String applicationStatus, String mongodbStatus, Instant checkedAt) { }
}
