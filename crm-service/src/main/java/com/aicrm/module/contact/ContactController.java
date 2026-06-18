package com.aicrm.module.contact;

import com.aicrm.common.dto.PageResponse;
import com.aicrm.module.contact.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    public PageResponse<ContactSummaryDto> getAll(
        @RequestParam(defaultValue = "0")  int    page,
        @RequestParam(defaultValue = "20") int    size,
        @RequestParam(required = false)    String search,
        @RequestParam(required = false)    String tagId
    ) {
        return PageResponse.of(contactService.getAll(page, size, search, tagId));
    }

    @GetMapping("/{id}")
    public ContactDto getById(@PathVariable String id) {
        return contactService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContactDto create(@Valid @RequestBody CreateContactRequest request) {
        return contactService.create(request);
    }

    @PutMapping("/{id}")
    public ContactDto update(@PathVariable String id,
                             @Valid @RequestBody UpdateContactRequest request) {
        return contactService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        contactService.delete(id);
    }
}
