package com.ondc.autoonboarder.service;

import com.ondc.autoonboarder.dto.LoginRequest;
import com.ondc.autoonboarder.dto.LoginResponse;
import com.ondc.autoonboarder.dto.RegisterRequest;
import com.ondc.autoonboarder.model.User;
import com.ondc.autoonboarder.repository.UserRepository;
import com.ondc.autoonboarder.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role().toUpperCase());
        Instant now = Instant.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        userRepository.save(user);
        String accessToken = jwtUtil.generateToken(user.getId(), user.getRole());
        String refreshToken = ""; // placeholder, implement refresh later
        return new LoginResponse(accessToken, refreshToken);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        String accessToken = jwtUtil.generateToken(user.getId(), user.getRole());
        String refreshToken = ""; // placeholder
        return new LoginResponse(accessToken, refreshToken);
    }
}
