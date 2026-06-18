package com.aicrm.admin;

import com.aicrm.common.exception.ApiException;
import com.aicrm.common.exception.ErrorCode;
import com.aicrm.module.admin.UserAdminService;
import com.aicrm.module.admin.dto.CreateUserRequest;
import com.aicrm.module.admin.dto.UpdateUserRoleRequest;
import com.aicrm.module.admin.dto.UpdateUserStatusRequest;
import com.aicrm.module.admin.dto.UserAdminDto;
import com.aicrm.module.user.Role;
import com.aicrm.module.user.Status;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserAdminServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UserAdminService userAdminService;

    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId("admin-1");
        adminUser.setEmail("admin@test.com");
        adminUser.setDisplayName("Admin User");
        adminUser.setRole(Role.ADMIN);
        adminUser.setStatus(Status.ACTIVE);

        regularUser = new User();
        regularUser.setId("user-1");
        regularUser.setEmail("user@test.com");
        regularUser.setDisplayName("Regular User");
        regularUser.setRole(Role.USER);
        regularUser.setStatus(Status.ACTIVE);
    }

    @Test
    void listAll_returnsAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(adminUser, regularUser));

        List<UserAdminDto> result = userAdminService.listAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).email()).isEqualTo("admin@test.com");
    }

    @Test
    void createUser_withUniqueEmail_savesAndReturns() {
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateUserRequest req = new CreateUserRequest("new@test.com", "New User", "password123", Role.USER);
        UserAdminDto result = userAdminService.createUser(req);

        assertThat(result.email()).isEqualTo("new@test.com");
        assertThat(result.role()).isEqualTo("USER");
        assertThat(result.status()).isEqualTo("ACTIVE");
    }

    @Test
    void createUser_withDuplicateEmail_throwsConflict() {
        when(userRepository.existsByEmail("admin@test.com")).thenReturn(true);

        CreateUserRequest req = new CreateUserRequest("admin@test.com", "Dup", "password123", Role.USER);
        assertThatThrownBy(() -> userAdminService.createUser(req))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CONFLICT);
    }

    @Test
    void updateRole_lastAdmin_throwsLastAdmin() {
        when(userRepository.findById("admin-1")).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRoleAndStatus(Role.ADMIN, Status.ACTIVE)).thenReturn(1L);

        UpdateUserRoleRequest req = new UpdateUserRoleRequest(Role.USER);
        assertThatThrownBy(() -> userAdminService.updateRole("admin-1", req, "other-user"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.LAST_ADMIN);
    }

    @Test
    void updateRole_notLastAdmin_updatesSuccessfully() {
        when(userRepository.findById("admin-1")).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRoleAndStatus(Role.ADMIN, Status.ACTIVE)).thenReturn(2L);
        when(userRepository.save(any(User.class))).thenReturn(adminUser);

        UpdateUserRoleRequest req = new UpdateUserRoleRequest(Role.USER);
        UserAdminDto result = userAdminService.updateRole("admin-1", req, "other-user");

        assertThat(result).isNotNull();
        verify(userRepository).save(adminUser);
    }

    @Test
    void updateStatus_selfDeactivation_throwsForbidden() {
        UpdateUserStatusRequest req = new UpdateUserStatusRequest(Status.INACTIVE);
        assertThatThrownBy(() -> userAdminService.updateStatus("admin-1", req, "admin-1"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.SELF_DEACTIVATION);
    }

    @Test
    void updateStatus_lastAdmin_throwsLastAdmin() {
        when(userRepository.findById("admin-1")).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRoleAndStatus(Role.ADMIN, Status.ACTIVE)).thenReturn(1L);

        UpdateUserStatusRequest req = new UpdateUserStatusRequest(Status.INACTIVE);
        assertThatThrownBy(() -> userAdminService.updateStatus("admin-1", req, "other-user"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.LAST_ADMIN);
    }

    @Test
    void updateStatus_validDeactivation_updatesSuccessfully() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(regularUser));
        when(userRepository.save(any(User.class))).thenReturn(regularUser);

        UpdateUserStatusRequest req = new UpdateUserStatusRequest(Status.INACTIVE);
        UserAdminDto result = userAdminService.updateStatus("user-1", req, "admin-1");

        assertThat(result).isNotNull();
        verify(userRepository).save(regularUser);
    }
}
