package com.example.heatwaveadvisory.auth;

import java.util.Set;

public record AuthResponse(String accessToken, String tokenType, long expiresInSeconds, UserInfo user) {
    public record UserInfo(String username, Set<String> roles) { }
}
