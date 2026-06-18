package com.aicrm.config;

import com.aicrm.module.user.Role;
import com.aicrm.module.user.Status;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
public class DevDataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByEmail("admin@aicrm.local")) {
            User admin = new User();
            admin.setEmail("admin@aicrm.local");
            admin.setDisplayName("CRM Admin");
            admin.setPasswordHash(passwordEncoder.encode("Admin1234!"));
            admin.setRole(Role.ADMIN);
            admin.setStatus(Status.ACTIVE);
            userRepository.save(admin);
        }
    }
}
