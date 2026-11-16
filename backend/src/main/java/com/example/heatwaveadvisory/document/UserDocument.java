package com.example.heatwaveadvisory.document;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Set;

@Data
@NoArgsConstructor
@Document("app_users")
public class UserDocument {
    @Id private String id;
    @Indexed(unique = true) private String username;
    private String passwordHash;
    private Set<String> roles;
    private Instant createdAt;
}
