package com.aicrm.module.tag;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
public class Tag {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "name", length = 100, nullable = false)
    private String name;

    @Column(name = "colour", length = 7, nullable = false)
    private String colour;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @PrePersist
    private void generateId() {
        if (id == null) id = UUID.randomUUID().toString();
    }
}
