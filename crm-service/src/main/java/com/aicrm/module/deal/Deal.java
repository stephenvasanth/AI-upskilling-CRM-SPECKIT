package com.aicrm.module.deal;

import com.aicrm.module.contact.Contact;
import com.aicrm.module.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "deals")
@Getter
@Setter
@NoArgsConstructor
public class Deal {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "title", length = 255, nullable = false)
    private String title;

    @Column(name = "value", precision = 15, scale = 2)
    private BigDecimal value;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", length = 20, nullable = false)
    private DealStage stage = DealStage.LEAD;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    private void generateId() {
        if (id == null) id = UUID.randomUUID().toString();
    }
}
