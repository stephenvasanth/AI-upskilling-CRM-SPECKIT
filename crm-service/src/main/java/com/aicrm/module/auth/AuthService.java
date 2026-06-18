package com.aicrm.module.auth;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.auth.dto.*;
import com.aicrm.module.user.Status;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserService;
import com.aicrm.security.JwtService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserService userService, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userService.findByEmail(request.email())
                .orElseThrow(ApiException::authFailed);

        if (user.getStatus() == Status.INACTIVE) {
            throw ApiException.authFailed();
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.authFailed();
        }

        String token = jwtService.generateToken(user);
        return new LoginResponse(token, UserService.toDto(user));
    }

    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public UserDto updateProfile(String userId, UpdateProfileRequest request) {
        User user = userService.findByEmail(userService.getById(userId).email())
                .orElseThrow(() -> ApiException.notFound("User"));
        user.setDisplayName(request.displayName());
        return UserService.toDto(userService.save(user));
    }

    @CacheEvict(value = "users", key = "#userId")
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userService.findByEmail(userService.getById(userId).email())
                .orElseThrow(() -> ApiException.notFound("User"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw ApiException.invalidPassword();
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userService.save(user);
    }
}
