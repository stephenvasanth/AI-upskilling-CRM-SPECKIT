package com.aicrm.module.user;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.auth.dto.UserDto;
import com.aicrm.module.user.dto.UserSummaryDto;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Cacheable(value = "users", key = "#id")
    @Transactional(readOnly = true)
    public UserDto getById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User"));
        return toDto(user);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase());
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email.toLowerCase());
    }

    @CacheEvict(value = "users", key = "#user.id")
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllActive() {
        return userRepository.findAll().stream()
            .filter(u -> u.getStatus() == Status.ACTIVE)
            .map(u -> new UserSummaryDto(u.getId(), u.getDisplayName()))
            .toList();
    }

    public static UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name(),
                user.getStatus().name(),
                user.getCreatedAt()
        );
    }
}
