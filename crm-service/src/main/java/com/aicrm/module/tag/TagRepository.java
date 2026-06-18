package com.aicrm.module.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, String> {
    List<Tag> findAllByOrderByNameAsc();

    @Query(value = "SELECT tag_id, COUNT(contact_id) FROM contact_tags GROUP BY tag_id", nativeQuery = true)
    List<Object[]> countContactsPerTag();
}
