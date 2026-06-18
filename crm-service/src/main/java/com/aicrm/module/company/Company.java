package com.aicrm.module.company;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
public class Company {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "name", length = 255, nullable = false)
    private String name;

    @PrePersist
    private void generateId() {
        if (id == null) id = UUID.randomUUID().toString();
    }
}
