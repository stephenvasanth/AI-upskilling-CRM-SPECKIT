package com.aicrm.module.activity;

import com.aicrm.module.contact.Contact;
import com.aicrm.module.deal.Deal;
import com.aicrm.module.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "activities")
@Getter
@Setter
@NoArgsConstructor
public class Activity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 10, nullable = false)
    private ActivityType type;

    @Column(name = "subject", length = 255, nullable = false)
    private String subject;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "activity_date", nullable = false)
    private Instant activityDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id")
    private Deal deal;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @PrePersist
    private void defaults() {
        if (id == null) id = UUID.randomUUID().toString();
        if (activityDate == null) activityDate = Instant.now();
    }
}
