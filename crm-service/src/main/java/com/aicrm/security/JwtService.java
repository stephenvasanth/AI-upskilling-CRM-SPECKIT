package com.aicrm.security;

import com.aicrm.module.user.Role;
import com.aicrm.module.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expiryHours;

    public JwtService(SecretKey jwtSecretKey,
                      @Value("${app.jwt.expiry-hours:8}") long expiryHours) {
        this.secretKey = jwtSecretKey;
        this.expiryHours = expiryHours;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId())
                .claim("role", user.getRole().name())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiryHours, ChronoUnit.HOURS)))
                .signWith(secretKey, Jwts.SIG.HS512)
                .compact();
    }

    public UserPrincipal validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();
            String email = claims.get("email", String.class);
            Role role = Role.valueOf(claims.get("role", String.class));
            return new UserPrincipal(userId, email, role);
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
