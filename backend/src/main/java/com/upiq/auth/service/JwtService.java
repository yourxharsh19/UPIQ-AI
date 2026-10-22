package com.upiq.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    private static final String LOCAL_DEVELOPMENT_SECRET =
            "local_dev_secret_key_minimum_256_bits_for_upiq_2_0_local_development_only";
    private static final int MIN_HMAC_KEY_BYTES = 32;

    @Value("${jwt.secret}")
    private String secretKey;

    @Autowired
    private Environment environment;

    @Value("${jwt.expiration:3600000}")
    private long expiration;

    @PostConstruct
    void validateSigningKeyConfiguration() {
        boolean production = environment.acceptsProfiles(Profiles.of("prod"));
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("JWT signing secret must not be blank");
        }
        if (production && LOCAL_DEVELOPMENT_SECRET.equals(secretKey)) {
            throw new IllegalStateException("Production requires an externally supplied JWT signing secret");
        }
        if (secretKey.getBytes(StandardCharsets.UTF_8).length < MIN_HMAC_KEY_BYTES) {
            throw new IllegalStateException("JWT signing secret must be at least 256 bits for HMAC signing");
        }
        try {
            // Validate at startup using the same key construction and algorithm selection as JJWT.
            Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("JWT signing secret is not valid for HMAC signing");
        }
        if (production) {
            log.info("Production JWT signing key configuration validated");
        }
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    // 🧾 Generate JWT token
    public String generateToken(String email, String role, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("userId", userId.toString()); // Add userId to claims

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    // ✅ Extract email (subject)
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // ✅ Extract role
    public String extractRole(String token) {
        return (String) extractAllClaims(token).get("role");
    }

    // ✅ Validate token
    public boolean isTokenValid(String token, String email) {
        final String extractedEmail = extractEmail(token);
        return (extractedEmail.equals(email) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            throw new RuntimeException("Invalid JWT token", e);
        }
    }
}
