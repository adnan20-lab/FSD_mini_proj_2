package com.example.heatwaveadvisory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class HeatwaveAdvisoryApplication {
    public static void main(String[] args) {
        SpringApplication.run(HeatwaveAdvisoryApplication.class, args);
    }
}
