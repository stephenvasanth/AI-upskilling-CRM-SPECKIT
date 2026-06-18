package com.aicrm.module.contact;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface ContactRepository extends JpaRepository<Contact, String> {

    long countByCreatedAtAfter(Instant createdAt);

    @Query("""
        SELECT c FROM Contact c
        LEFT JOIN c.company co
        LEFT JOIN c.owner o
        WHERE (:search IS NULL OR :search = '' OR
               LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(c.lastName)  LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(c.email)     LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(co.name)     LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:tagId IS NULL OR :tagId = '' OR
               EXISTS (SELECT 1 FROM c.tags t WHERE t.id = :tagId))
        """)
    Page<Contact> findAllFiltered(
        @Param("search") String search,
        @Param("tagId")  String tagId,
        Pageable pageable
    );
}
