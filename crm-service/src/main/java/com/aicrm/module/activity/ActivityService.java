package com.aicrm.module.activity;

import com.aicrm.common.dto.PageResponse;
import com.aicrm.common.exception.ApiException;
import com.aicrm.module.activity.dto.ActivityDto;
import com.aicrm.module.activity.dto.ActivityFilterParams;
import com.aicrm.module.activity.dto.CreateActivityRequest;
import com.aicrm.module.contact.Contact;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.deal.Deal;
import com.aicrm.module.deal.DealRepository;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;

    private static final int PAGE_SIZE = 20;

    @Cacheable(value = "activities-contact", key = "#contactId + ':' + #page")
    public PageResponse<ActivityDto> getByContact(String contactId, int page) {
        Pageable pageable = PageRequest.of(page, PAGE_SIZE, Sort.by("activityDate").descending());
        return PageResponse.of(activityRepository.findByContactIdOrderByActivityDateDesc(contactId, pageable)
            .map(this::toDto));
    }

    @Cacheable(value = "activities-deal", key = "#dealId + ':' + #page")
    public PageResponse<ActivityDto> getByDeal(String dealId, int page) {
        Pageable pageable = PageRequest.of(page, PAGE_SIZE, Sort.by("activityDate").descending());
        return PageResponse.of(activityRepository.findByDealIdOrderByActivityDateDesc(dealId, pageable)
            .map(this::toDto));
    }

    @Cacheable(value = "activities-global", key = "#params.type() + ':' + #params.contactId() + ':' + #params.dateFrom() + ':' + #params.dateTo() + ':' + #params.page()")
    public PageResponse<ActivityDto> getGlobal(ActivityFilterParams params) {
        Pageable pageable = PageRequest.of(params.page(), PAGE_SIZE, Sort.by("activityDate").descending());
        Specification<Activity> spec = buildSpec(params);
        return PageResponse.of(activityRepository.findAll(spec, pageable).map(this::toDto));
    }

    @Caching(evict = {
        @CacheEvict(value = "activities-contact", allEntries = true),
        @CacheEvict(value = "activities-deal",    allEntries = true),
        @CacheEvict(value = "activities-global",  allEntries = true),
        @CacheEvict(value = "dashboard",          allEntries = true)
    })
    @Transactional
    public ActivityDto create(CreateActivityRequest request, String authorUserId) {
        User author = userRepository.findById(authorUserId)
            .orElseThrow(() -> ApiException.notFound("User"));

        Activity activity = new Activity();
        activity.setType(request.type());
        activity.setSubject(request.subject());
        activity.setNotes(request.notes());
        activity.setActivityDate(request.activityDate()); // @PrePersist defaults to now() if null
        activity.setAuthor(author);

        if (request.contactId() != null && !request.contactId().isBlank()) {
            Contact contact = contactRepository.findById(request.contactId())
                .orElseThrow(() -> ApiException.notFound("Contact"));
            activity.setContact(contact);
        }
        if (request.dealId() != null && !request.dealId().isBlank()) {
            Deal deal = dealRepository.findById(request.dealId())
                .orElseThrow(() -> ApiException.notFound("Deal"));
            activity.setDeal(deal);
        }

        return toDto(activityRepository.save(activity));
    }

    @Caching(evict = {
        @CacheEvict(value = "activities-contact", allEntries = true),
        @CacheEvict(value = "activities-deal",    allEntries = true),
        @CacheEvict(value = "activities-global",  allEntries = true),
        @CacheEvict(value = "dashboard",          allEntries = true)
    })
    @Transactional
    public void delete(String id) {
        if (!activityRepository.existsById(id)) {
            throw ApiException.notFound("Activity");
        }
        activityRepository.deleteById(id);
    }

    private Specification<Activity> buildSpec(ActivityFilterParams params) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (params.type() != null) {
                predicates.add(cb.equal(root.get("type"), params.type()));
            }
            if (params.contactId() != null && !params.contactId().isBlank()) {
                predicates.add(cb.equal(root.get("contact").get("id"), params.contactId()));
            }
            if (params.dateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("activityDate"), params.dateFrom()));
            }
            if (params.dateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("activityDate"), params.dateTo()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private ActivityDto toDto(Activity a) {
        return new ActivityDto(
            a.getId(),
            a.getType().name(),
            a.getSubject(),
            a.getNotes(),
            a.getActivityDate(),
            a.getAuthor() != null ? a.getAuthor().getId() : null,
            a.getAuthor() != null ? a.getAuthor().getDisplayName() : null,
            a.getContact() != null ? a.getContact().getId() : null,
            a.getContact() != null ? a.getContact().getFirstName() + " " + a.getContact().getLastName() : null,
            a.getDeal() != null ? a.getDeal().getId() : null,
            a.getDeal() != null ? a.getDeal().getTitle() : null,
            a.getCreatedAt()
        );
    }
}
