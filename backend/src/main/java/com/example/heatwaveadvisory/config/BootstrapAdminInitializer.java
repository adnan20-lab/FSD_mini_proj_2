package com.example.heatwaveadvisory.config;

import com.example.heatwaveadvisory.service.AuthService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class BootstrapAdminInitializer implements ApplicationRunner {
    private final AuthService authService;
    private final String username;
    private final String password;

    public BootstrapAdminInitializer(AuthService authService,
            @Value("${app.security.bootstrap-admin.username:}") String username,
            @Value("${app.security.bootstrap-admin.password:}") String password) {
        this.authService = authService;
        this.username = username;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (username != null && !username.isBlank() && password != null && password.length() >= 10) {
            authService.createBootstrapAdmin(username, password);
        }
    }
}
