package com.aicrm.config;

import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtConfig {

    @Value("${app.jwt.secret}")
    private String secret;

    @PostConstruct
    public void validate() {
        if (secret == null || secret.length() < 64) {
            throw new IllegalStateException("JWT_SECRET must be at least 64 characters long");
        }
    }

    @Bean
    public SecretKey jwtSecretKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
