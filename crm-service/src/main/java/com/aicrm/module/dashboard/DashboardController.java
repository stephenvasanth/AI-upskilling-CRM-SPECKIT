package com.aicrm.module.dashboard;

import com.aicrm.module.dashboard.dto.DashboardSummaryDto;
import com.aicrm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getSummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(dashboardService.getSummary(principal.getUserId()));
    }
}
