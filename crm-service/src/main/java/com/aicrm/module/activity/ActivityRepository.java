package com.aicrm.module.activity;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, String>,
        JpaSpecificationExecutor<Activity> {

    List<Activity> findByContactIdOrderByActivityDateDesc(String contactId);

    Page<Activity> findByContactIdOrderByActivityDateDesc(String contactId, Pageable pageable);

    Page<Activity> findByDealIdOrderByActivityDateDesc(String dealId, Pageable pageable);

    @Query("""
        SELECT a FROM Activity a
        LEFT JOIN FETCH a.author
        LEFT JOIN FETCH a.contact
        LEFT JOIN FETCH a.deal
        ORDER BY a.createdAt DESC
        """)
    List<Activity> findRecentActivitiesForDashboard(Pageable pageable);
}
