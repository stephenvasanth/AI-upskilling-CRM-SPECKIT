package com.aicrm.module.deal;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.contact.Contact;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.deal.dto.*;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    private static final List<DealStage> STAGE_ORDER = List.of(
        DealStage.LEAD, DealStage.QUALIFIED, DealStage.PROPOSAL,
        DealStage.NEGOTIATION, DealStage.CLOSED_WON, DealStage.CLOSED_LOST
    );

    @Cacheable("deals::board")
    public DealBoardDto getBoardGroupedByStage() {
        List<Deal> all = dealRepository.findAllByOrderByCreatedAtAsc();
        Map<String, List<DealDto>> stages = new LinkedHashMap<>();
        for (DealStage stage : STAGE_ORDER) {
            stages.put(stage.name(), new ArrayList<>());
        }
        for (Deal deal : all) {
            stages.computeIfAbsent(deal.getStage().name(), k -> new ArrayList<>()).add(toDto(deal));
        }
        return new DealBoardDto(stages);
    }

    public List<DealDto> getByContactId(String contactId) {
        return dealRepository.findByContact_IdOrderByCreatedAtDesc(contactId)
            .stream().map(this::toDto).toList();
    }

    @Cacheable(value = "deals", key = "#id")
    public DealDto getById(String id) {
        return dealRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> ApiException.notFound("Deal"));
    }

    @Caching(evict = {
        @CacheEvict(value = "deals::board",      allEntries = true),
        @CacheEvict(value = "deals::by-contact", allEntries = true),
        @CacheEvict(value = "dashboard",         allEntries = true)
    })
    @Transactional
    public DealDto create(CreateDealRequest request) {
        Deal deal = new Deal();
        applyRequest(deal, request.title(), request.stage(), request.value(),
            request.expectedCloseDate(), request.contactId(), request.ownerId(), request.notes());
        return toDto(dealRepository.save(deal));
    }

    @Caching(evict = {
        @CacheEvict(value = "deals",             key = "#id"),
        @CacheEvict(value = "deals::board",      allEntries = true),
        @CacheEvict(value = "deals::by-contact", allEntries = true),
        @CacheEvict(value = "dashboard",         allEntries = true)
    })
    @Transactional
    public DealDto update(String id, UpdateDealRequest request) {
        Deal deal = dealRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Deal"));
        DealStage stage = request.stage() != null ? request.stage() : deal.getStage();
        applyRequest(deal, request.title(), stage, request.value(),
            request.expectedCloseDate(), request.contactId(), request.ownerId(), request.notes());
        return toDto(dealRepository.save(deal));
    }

    @Caching(evict = {
        @CacheEvict(value = "deals",             key = "#id"),
        @CacheEvict(value = "deals::board",      allEntries = true),
        @CacheEvict(value = "deals::by-contact", allEntries = true),
        @CacheEvict(value = "dashboard",         allEntries = true)
    })
    @Transactional
    public DealDto moveStage(String id, MoveStageRequest request) {
        Deal deal = dealRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Deal"));
        deal.setStage(request.stage());
        return toDto(dealRepository.save(deal));
    }

    @Caching(evict = {
        @CacheEvict(value = "deals",             key = "#id"),
        @CacheEvict(value = "deals::board",      allEntries = true),
        @CacheEvict(value = "deals::by-contact", allEntries = true),
        @CacheEvict(value = "dashboard",         allEntries = true)
    })
    @Transactional
    public void delete(String id) {
        if (!dealRepository.existsById(id)) {
            throw ApiException.notFound("Deal");
        }
        dealRepository.deleteById(id);
    }

    private void applyRequest(Deal deal, String title, DealStage stage,
                               java.math.BigDecimal value, java.time.LocalDate closeDate,
                               String contactId, String ownerId, String notes) {
        deal.setTitle(title);
        deal.setStage(stage != null ? stage : DealStage.LEAD);
        deal.setValue(value);
        deal.setExpectedCloseDate(closeDate);
        deal.setNotes(notes);

        if (contactId != null && !contactId.isBlank()) {
            Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> ApiException.notFound("Contact"));
            deal.setContact(contact);
        } else {
            deal.setContact(null);
        }

        if (ownerId != null && !ownerId.isBlank()) {
            User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("User"));
            deal.setOwner(owner);
        } else {
            deal.setOwner(null);
        }
    }

    private DealDto toDto(Deal d) {
        return new DealDto(
            d.getId(),
            d.getTitle(),
            d.getValue(),
            d.getStage().name(),
            d.getExpectedCloseDate(),
            d.getContact() != null ? d.getContact().getId() : null,
            d.getContact() != null ? d.getContact().getFirstName() + " " + d.getContact().getLastName() : null,
            d.getOwner() != null ? d.getOwner().getId() : null,
            d.getOwner() != null ? d.getOwner().getDisplayName() : null,
            d.getNotes(),
            d.getCreatedAt(),
            d.getUpdatedAt()
        );
    }
}
