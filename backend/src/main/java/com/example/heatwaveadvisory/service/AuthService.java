package com.example.heatwaveadvisory.service;

import com.example.heatwaveadvisory.auth.AuthResponse;
import com.example.heatwaveadvisory.auth.LoginRequest;
import com.example.heatwaveadvisory.auth.RegisterRequest;
import com.example.heatwaveadvisory.document.UserDocument;
import com.example.heatwaveadvisory.exception.ConflictException;
import com.example.heatwaveadvisory.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Service
public class AuthService {
    private static final String ISSUER = "heatwave-advisory-api";
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final long expirationSeconds;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                       @Value("${app.security.jwt.expiration-minutes:120}") long expirationMinutes) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.expirationSeconds = Math.max(5, expirationMinutes) * 60;
    }

    public AuthResponse register(RegisterRequest request) {
        String username = normalize(request.username());
        if (users.existsByUsername(username)) throw new ConflictException("That username is already registered.");
        UserDocument user = new UserDocument();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of("OPERATOR")); // Public registration cannot create administrators.
        user.setCreatedAt(Instant.now());
        try {
            return issue(users.save(user));
        } catch (DuplicateKeyException ex) {
            throw new ConflictException("That username is already registered.");
        }
    }

    public AuthResponse login(LoginRequest request) {
        String username = normalize(request.username());
        UserDocument user = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password."));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password.");
        }
        return issue(user);
    }

    public void createBootstrapAdmin(String username, String rawPassword) {
        String normalized = normalize(username);
        if (users.existsByUsername(normalized)) return;
        UserDocument admin = new UserDocument();
        admin.setUsername(normalized);
        admin.setPasswordHash(passwordEncoder.encode(rawPassword));
        admin.setRoles(Set.of("ADMIN"));
        admin.setCreatedAt(Instant.now());
        try { users.save(admin); } catch (DuplicateKeyException ignored) { /* another instance created it */ }
    }

    private AuthResponse issue(UserDocument user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER).issuedAt(now).expiresAt(now.plusSeconds(expirationSeconds))
                .subject(user.getUsername()).claim("roles", user.getRoles()).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", expirationSeconds,
                new AuthResponse.UserInfo(user.getUsername(), user.getRoles()));
    }

    private String normalize(String username) { return username.trim().toLowerCase(Locale.ROOT); }
}
