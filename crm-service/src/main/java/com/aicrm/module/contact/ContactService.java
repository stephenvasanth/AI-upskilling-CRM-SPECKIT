package com.aicrm.module.contact;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.company.Company;
import com.aicrm.module.company.CompanyRepository;
import com.aicrm.module.contact.dto.*;
import com.aicrm.module.tag.Tag;
import com.aicrm.module.tag.TagRepository;
import com.aicrm.module.tag.dto.TagDto;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;

    public Page<ContactSummaryDto> getAll(int page, int size, String search, String tagId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("lastName").ascending().and(Sort.by("firstName").ascending()));
        return contactRepository.findAllFiltered(search, tagId, pageable)
            .map(this::toSummaryDto);
    }

    @Cacheable(value = "contacts", key = "#id")
    public ContactDto getById(String id) {
        return contactRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> ApiException.notFound("Contact"));
    }

    @CacheEvict(value = "dashboard", allEntries = true)
    @Transactional
    public ContactDto create(CreateContactRequest request) {
        Contact contact = new Contact();
        applyRequest(contact, request.firstName(), request.lastName(), request.email(),
            request.phone(), request.jobTitle(), request.companyId(), request.ownerId(), request.tagIds());
        return toDto(contactRepository.save(contact));
    }

    @Caching(evict = {
        @CacheEvict(value = "contacts", key = "#id"),
        @CacheEvict(value = "dashboard", allEntries = true)
    })
    @Transactional
    public ContactDto update(String id, UpdateContactRequest request) {
        Contact contact = contactRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Contact"));
        applyRequest(contact, request.firstName(), request.lastName(), request.email(),
            request.phone(), request.jobTitle(), request.companyId(), request.ownerId(), request.tagIds());
        return toDto(contactRepository.save(contact));
    }

    @Caching(evict = {
        @CacheEvict(value = "contacts", key = "#id"),
        @CacheEvict(value = "dashboard", allEntries = true)
    })
    @Transactional
    public void delete(String id) {
        if (!contactRepository.existsById(id)) {
            throw ApiException.notFound("Contact");
        }
        contactRepository.deleteById(id);
    }

    private void applyRequest(Contact contact, String firstName, String lastName, String email,
                               String phone, String jobTitle, String companyId, String ownerId, List<String> tagIds) {
        contact.setFirstName(firstName);
        contact.setLastName(lastName);
        contact.setEmail(email);
        contact.setPhone(phone);
        contact.setJobTitle(jobTitle);

        if (companyId != null && !companyId.isBlank()) {
            Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> ApiException.notFound("Company"));
            contact.setCompany(company);
        } else {
            contact.setCompany(null);
        }

        if (ownerId != null && !ownerId.isBlank()) {
            User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("User"));
            contact.setOwner(owner);
        } else {
            contact.setOwner(null);
        }

        if (tagIds != null && !tagIds.isEmpty()) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(tagIds));
            contact.setTags(tags);
        } else {
            contact.setTags(new HashSet<>());
        }
    }

    private ContactSummaryDto toSummaryDto(Contact c) {
        return new ContactSummaryDto(
            c.getId(),
            c.getFirstName(),
            c.getLastName(),
            c.getEmail(),
            c.getCompany() != null ? c.getCompany().getName() : null,
            c.getTags().stream()
                .map(t -> new TagDto(t.getId(), t.getName(), t.getColour()))
                .toList(),
            c.getCreatedAt()
        );
    }

    private ContactDto toDto(Contact c) {
        return new ContactDto(
            c.getId(),
            c.getFirstName(),
            c.getLastName(),
            c.getEmail(),
            c.getPhone(),
            c.getJobTitle(),
            c.getCompany() != null ? c.getCompany().getId() : null,
            c.getCompany() != null ? c.getCompany().getName() : null,
            c.getOwner() != null ? c.getOwner().getId() : null,
            c.getOwner() != null ? c.getOwner().getDisplayName() : null,
            c.getTags().stream()
                .map(t -> new TagDto(t.getId(), t.getName(), t.getColour()))
                .toList(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }
}
