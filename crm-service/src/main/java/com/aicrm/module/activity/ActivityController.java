package com.aicrm.module.activity;

import com.aicrm.common.dto.PageResponse;
import com.aicrm.module.activity.dto.ActivityDto;
import com.aicrm.module.activity.dto.ActivityFilterParams;
import com.aicrm.module.activity.dto.CreateActivityRequest;
import com.aicrm.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping
    public PageResponse<ActivityDto> getActivities(
            @RequestParam(required = false) String contactId,
            @RequestParam(required = false) String dealId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(defaultValue = "0") int page) {

        if (contactId != null && !contactId.isBlank()) {
            return activityService.getByContact(contactId, page);
        }
        if (dealId != null && !dealId.isBlank()) {
            return activityService.getByDeal(dealId, page);
        }

        ActivityType activityType = null;
        if (type != null && !type.isBlank()) {
            try { activityType = ActivityType.valueOf(type.toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }

        Instant from = dateFrom != null && !dateFrom.isBlank() ? Instant.parse(dateFrom) : null;
        Instant to   = dateTo   != null && !dateTo.isBlank()   ? Instant.parse(dateTo)   : null;

        ActivityFilterParams params = new ActivityFilterParams(activityType, null, from, to, page);
        return activityService.getGlobal(params);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityDto create(@Valid @RequestBody CreateActivityRequest request,
                              @AuthenticationPrincipal UserPrincipal principal) {
        return activityService.create(request, principal.getUserId());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        activityService.delete(id);
    }
}
