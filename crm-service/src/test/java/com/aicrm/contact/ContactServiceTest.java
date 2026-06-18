package com.aicrm.contact;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.company.Company;
import com.aicrm.module.company.CompanyRepository;
import com.aicrm.module.contact.Contact;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.contact.ContactService;
import com.aicrm.module.contact.dto.*;
import com.aicrm.module.tag.Tag;
import com.aicrm.module.tag.TagRepository;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

    @Mock private ContactRepository contactRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;
    @Mock private TagRepository tagRepository;

    @InjectMocks private ContactService contactService;

    private Contact sampleContact;
    private Company sampleCompany;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleCompany = new Company();
        sampleCompany.setId("company-1");
        sampleCompany.setName("Acme Corp");

        sampleUser = new User();
        sampleUser.setId("user-1");
        sampleUser.setDisplayName("Jane Doe");

        sampleContact = new Contact();
        sampleContact.setId("contact-1");
        sampleContact.setFirstName("John");
        sampleContact.setLastName("Smith");
        sampleContact.setEmail("john@example.com");
        sampleContact.setCompany(sampleCompany);
        sampleContact.setOwner(sampleUser);
        sampleContact.setTags(new HashSet<>());
    }

    @Test
    void getAll_returnsPagedSummaries() {
        Page<Contact> page = new PageImpl<>(List.of(sampleContact), PageRequest.of(0, 20), 1);
        when(contactRepository.findAllFiltered(anyString(), anyString(), any(Pageable.class))).thenReturn(page);

        var result = contactService.getAll(0, 20, "", "");

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).firstName()).isEqualTo("John");
        assertThat(result.getContent().get(0).company()).isEqualTo("Acme Corp");
    }

    @Test
    void getById_found_returnsDto() {
        when(contactRepository.findById("contact-1")).thenReturn(Optional.of(sampleContact));

        ContactDto dto = contactService.getById("contact-1");

        assertThat(dto.id()).isEqualTo("contact-1");
        assertThat(dto.firstName()).isEqualTo("John");
        assertThat(dto.companyName()).isEqualTo("Acme Corp");
        assertThat(dto.ownerName()).isEqualTo("Jane Doe");
    }

    @Test
    void getById_notFound_throwsNotFound() {
        when(contactRepository.findById(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contactService.getById("nonexistent"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void create_withValidRequest_savesAndReturnsDto() {
        when(companyRepository.findById("company-1")).thenReturn(Optional.of(sampleCompany));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(sampleUser));
        when(tagRepository.findAllById(anyList())).thenReturn(List.of());
        when(contactRepository.save(any(Contact.class))).thenReturn(sampleContact);

        CreateContactRequest req = new CreateContactRequest(
            "John", "Smith", "john@example.com", null, null, "company-1", "user-1", List.of()
        );
        ContactDto result = contactService.create(req);

        assertThat(result.firstName()).isEqualTo("John");
        verify(contactRepository).save(any(Contact.class));
    }

    @Test
    void update_existingContact_updatesAndReturnsDto() {
        when(contactRepository.findById("contact-1")).thenReturn(Optional.of(sampleContact));
        when(tagRepository.findAllById(anyList())).thenReturn(List.of());
        when(contactRepository.save(any(Contact.class))).thenReturn(sampleContact);

        UpdateContactRequest req = new UpdateContactRequest(
            "John", "Updated", "john@example.com", null, null, null, null, List.of()
        );
        ContactDto result = contactService.update("contact-1", req);

        assertThat(result.lastName()).isEqualTo("Smith");
        verify(contactRepository).save(sampleContact);
    }

    @Test
    void update_notFound_throwsNotFound() {
        when(contactRepository.findById(anyString())).thenReturn(Optional.empty());

        UpdateContactRequest req = new UpdateContactRequest("A", "B", null, null, null, null, null, null);
        assertThatThrownBy(() -> contactService.update("nonexistent", req))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void delete_existingContact_deletesSuccessfully() {
        when(contactRepository.existsById("contact-1")).thenReturn(true);

        contactService.delete("contact-1");

        verify(contactRepository).deleteById("contact-1");
    }

    @Test
    void delete_notFound_throwsNotFound() {
        when(contactRepository.existsById(anyString())).thenReturn(false);

        assertThatThrownBy(() -> contactService.delete("nonexistent"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }
}
