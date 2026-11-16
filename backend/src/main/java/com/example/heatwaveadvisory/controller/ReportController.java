package com.example.heatwaveadvisory.controller;

import com.example.heatwaveadvisory.dto.ReportSummary;
import com.example.heatwaveadvisory.service.ReportService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {
    private final ReportService reports;
    public ReportController(ReportService reports) { this.reports = reports; }
    @GetMapping("/summary") public ReportSummary summary(@RequestParam(required = false) String zoneId) { return reports.summary(zoneId); }
}
