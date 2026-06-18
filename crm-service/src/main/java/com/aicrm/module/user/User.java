package com.aicrm.module.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "email", length = 255, unique = true, nullable = false)
    private String email;

    @Column(name = "display_name", length = 100, nullable = false)
    private String displayName;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 10, nullable = false)
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10, nullable = false)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    private void generateId() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
    }
}
