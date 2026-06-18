package com.aicrm.module.deal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface DealRepository extends JpaRepository<Deal, String> {
    List<Deal> findAllByStage(DealStage stage);
    List<Deal> findAllByOrderByCreatedAtAsc();

    @Query("SELECT COUNT(d) FROM Deal d WHERE d.stage NOT IN ('CLOSED_WON','CLOSED_LOST')")
    long countOpenDeals();

    @Query("SELECT SUM(d.value) FROM Deal d WHERE d.stage NOT IN ('CLOSED_WON','CLOSED_LOST')")
    BigDecimal sumOpenDealValue();

    @Query("SELECT d.stage, COUNT(d), SUM(d.value) FROM Deal d WHERE d.stage != 'CLOSED_LOST' GROUP BY d.stage")
    List<Object[]> getPipelineSummary();

    List<Deal> findByContact_IdOrderByCreatedAtDesc(String contactId);
}
