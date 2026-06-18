package com.aicrm.auth;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.auth.AuthService;
import com.aicrm.module.auth.dto.*;
import com.aicrm.module.user.*;
import com.aicrm.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserService userService;
    @Mock private JwtService jwtService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private AuthService authService;

    private User activeAdmin;

    @BeforeEach
    void setUp() {
        activeAdmin = new User();
        activeAdmin.setEmail("admin@aicrm.local");
        activeAdmin.setDisplayName("CRM Admin");
        activeAdmin.setPasswordHash("$2a$10$hashed");
        activeAdmin.setRole(Role.ADMIN);
        activeAdmin.setStatus(Status.ACTIVE);
    }

    @Test
    void login_success_returnsTokenAndUser() {
        when(userService.findByEmail("admin@aicrm.local")).thenReturn(Optional.of(activeAdmin));
        when(passwordEncoder.matches("Admin1234!", activeAdmin.getPasswordHash())).thenReturn(true);
        when(jwtService.generateToken(activeAdmin)).thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest("admin@aicrm.local", "Admin1234!"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("admin@aicrm.local");
        assertThat(response.user().role()).isEqualTo("ADMIN");
    }

    @Test
    void login_wrongPassword_throwsAuthFailed() {
        when(userService.findByEmail(anyString())).thenReturn(Optional.of(activeAdmin));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("admin@aicrm.local", "wrong")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.AUTH_FAILED);
    }

    @Test
    void login_unknownEmail_throwsAuthFailed() {
        when(userService.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("unknown@test.com", "any")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.AUTH_FAILED);
    }

    @Test
    void login_inactiveUser_throwsAuthFailed() {
        activeAdmin.setStatus(Status.INACTIVE);
        when(userService.findByEmail(anyString())).thenReturn(Optional.of(activeAdmin));

        assertThatThrownBy(() -> authService.login(new LoginRequest("admin@aicrm.local", "Admin1234!")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.AUTH_FAILED);
    }

    @Test
    void changePassword_wrongCurrentPassword_throwsInvalidPassword() {
        UserDto dto = new UserDto("id1", "admin@aicrm.local", "CRM Admin", "ADMIN", "ACTIVE", null);
        when(userService.getById("id1")).thenReturn(dto);
        when(userService.findByEmail("admin@aicrm.local")).thenReturn(Optional.of(activeAdmin));
        when(passwordEncoder.matches("wrong", activeAdmin.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("id1", new ChangePasswordRequest("wrong", "NewPass123!")))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.INVALID_PASSWORD);
    }
}
