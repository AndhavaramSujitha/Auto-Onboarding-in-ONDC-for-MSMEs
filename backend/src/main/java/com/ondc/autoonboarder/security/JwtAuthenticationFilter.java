
package com.ondc.autoonboarder.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(
            HttpHeaders.AUTHORIZATION
        );

        // No token: continue. Protected APIs will be rejected
        // by Spring Security if authentication is required.
        if (authHeader == null || authHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Invalid Authorization header format
        if (!authHeader.startsWith("Bearer ")) {
            response.sendError(
                HttpServletResponse.SC_UNAUTHORIZED,
                "Invalid Authorization header"
            );
            return;
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            response.sendError(
                HttpServletResponse.SC_UNAUTHORIZED,
                "JWT token is missing"
            );
            return;
        }

        try {
            Claims claims = jwtUtil.validateAndParse(token);

            String userId = claims.getSubject();
            String role = claims.get("role", String.class);

            if (userId == null || userId.isBlank()) {
                throw new IllegalArgumentException(
                    "JWT subject is missing"
                );
            }

            if (role == null || role.isBlank()) {
                throw new IllegalArgumentException(
                    "JWT role is missing"
                );
            }

            // Normalize role:
            // SELLER       -> ROLE_SELLER
            // ROLE_SELLER  -> ROLE_SELLER
            String normalizedRole = role.trim().toUpperCase();

            if (!normalizedRole.startsWith("ROLE_")) {
                normalizedRole = "ROLE_" + normalizedRole;
            }

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    Collections.singletonList(
                        new SimpleGrantedAuthority(normalizedRole)
                    )
                );

            SecurityContextHolder.getContext()
                .setAuthentication(authentication);

            System.out.println("JWT AUTHENTICATION SUCCESS");
            System.out.println("USER ID: " + userId);
            System.out.println("ROLE: " + normalizedRole);

        } catch (Exception e) {

            SecurityContextHolder.clearContext();

            System.out.println(
                "JWT AUTHENTICATION FAILED: " + e.getMessage()
            );

            response.sendError(
                HttpServletResponse.SC_UNAUTHORIZED,
                "Invalid or expired JWT token"
            );

            return;
        }

        filterChain.doFilter(request, response);
    }
}
