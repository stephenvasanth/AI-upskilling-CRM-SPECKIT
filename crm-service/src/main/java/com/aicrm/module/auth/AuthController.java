package com.aicrm.module.auth;

import com.aicrm.module.auth.dto.*;
import com.aicrm.module.user.UserService;
import com.aicrm.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getById(principal.getUserId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(principal.getUserId(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(principal.getUserId(), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
