package com.aicrm.module.admin;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.admin.dto.CreateUserRequest;
import com.aicrm.module.admin.dto.UpdateUserRoleRequest;
import com.aicrm.module.admin.dto.UpdateUserStatusRequest;
import com.aicrm.module.admin.dto.UserAdminDto;
import com.aicrm.module.user.Role;
import com.aicrm.module.user.Status;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Cacheable("users::list")
    public List<UserAdminDto> listAll() {
        return userRepository.findAll().stream()
            .map(this::toDto)
            .toList();
    }

    @Caching(evict = {
        @CacheEvict(value = "users::list", allEntries = true)
    })
    @Transactional
    public UserAdminDto createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("Email already in use");
        }
        User user = new User();
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setPasswordHash(passwordEncoder.encode(request.initialPassword()));
        user.setRole(request.role());
        user.setStatus(Status.ACTIVE);
        return toDto(userRepository.save(user));
    }

    @Caching(evict = {
        @CacheEvict(value = "users::list", allEntries = true),
        @CacheEvict(value = "users",        key = "#id")
    })
    @Transactional
    public UserAdminDto updateRole(String id, UpdateUserRoleRequest request, String currentUserId) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("User"));

        if (user.getRole() == Role.ADMIN && request.role() != Role.ADMIN) {
            long activeAdmins = userRepository.countByRoleAndStatus(Role.ADMIN, Status.ACTIVE);
            if (activeAdmins <= 1) {
                throw ApiException.lastAdmin();
            }
        }

        user.setRole(request.role());
        return toDto(userRepository.save(user));
    }

    @Caching(evict = {
        @CacheEvict(value = "users::list", allEntries = true),
        @CacheEvict(value = "users",        key = "#id")
    })
    @Transactional
    public UserAdminDto updateStatus(String id, UpdateUserStatusRequest request, String currentUserId) {
        if (id.equals(currentUserId)) {
            throw ApiException.selfDeactivation();
        }

        User user = userRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("User"));

        if (user.getRole() == Role.ADMIN && request.status() == Status.INACTIVE) {
            long activeAdmins = userRepository.countByRoleAndStatus(Role.ADMIN, Status.ACTIVE);
            if (activeAdmins <= 1) {
                throw ApiException.lastAdmin();
            }
        }

        user.setStatus(request.status());
        return toDto(userRepository.save(user));
    }

    private UserAdminDto toDto(User u) {
        return new UserAdminDto(
            u.getId(),
            u.getEmail(),
            u.getDisplayName(),
            u.getRole().name(),
            u.getStatus().name(),
            u.getCreatedAt()
        );
    }
}
