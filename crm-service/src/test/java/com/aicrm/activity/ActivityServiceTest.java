package com.aicrm.activity;

import com.aicrm.common.dto.PageResponse;
import com.aicrm.common.exception.ApiException;
import com.aicrm.module.activity.Activity;
import com.aicrm.module.activity.ActivityRepository;
import com.aicrm.module.activity.ActivityService;
import com.aicrm.module.activity.ActivityType;
import com.aicrm.module.activity.dto.ActivityDto;
import com.aicrm.module.activity.dto.ActivityFilterParams;
import com.aicrm.module.activity.dto.CreateActivityRequest;
import com.aicrm.module.contact.Contact;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.deal.DealRepository;
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
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock private ActivityRepository activityRepository;
    @Mock private UserRepository userRepository;
    @Mock private ContactRepository contactRepository;
    @Mock private DealRepository dealRepository;

    @InjectMocks private ActivityService activityService;

    private User sampleUser;
    private Contact sampleContact;
    private Activity sampleActivity;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("user-1");
        sampleUser.setDisplayName("Jane Doe");

        sampleContact = new Contact();
        sampleContact.setId("contact-1");
        sampleContact.setFirstName("Alice");
        sampleContact.setLastName("Smith");

        sampleActivity = new Activity();
        sampleActivity.setId("activity-1");
        sampleActivity.setType(ActivityType.CALL);
        sampleActivity.setSubject("Follow-up call");
        sampleActivity.setActivityDate(Instant.now());
        sampleActivity.setAuthor(sampleUser);
        sampleActivity.setContact(sampleContact);
    }

    @Test
    void create_setsAuthorFromUserId() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(sampleUser));
        when(contactRepository.findById("contact-1")).thenReturn(Optional.of(sampleContact));
        when(activityRepository.save(any(Activity.class))).thenReturn(sampleActivity);

        CreateActivityRequest req = new CreateActivityRequest(
            ActivityType.CALL, "Follow-up call", null, null, "contact-1", null
        );
        ActivityDto dto = activityService.create(req, "user-1");

        assertThat(dto.authorId()).isEqualTo("user-1");
        assertThat(dto.subject()).isEqualTo("Follow-up call");
        assertThat(dto.type()).isEqualTo("CALL");
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void create_authorNotFound_throwsApiException() {
        when(userRepository.findById(anyString())).thenReturn(Optional.empty());

        CreateActivityRequest req = new CreateActivityRequest(
            ActivityType.NOTE, "Test", null, null, null, null
        );
        assertThatThrownBy(() -> activityService.create(req, "nonexistent"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void getByContact_returnsPaged() {
        Page<Activity> page = new PageImpl<>(List.of(sampleActivity));
        when(activityRepository.findByContactIdOrderByActivityDateDesc(eq("contact-1"), any(Pageable.class)))
            .thenReturn(page);

        PageResponse<ActivityDto> result = activityService.getByContact("contact-1", 0);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).subject()).isEqualTo("Follow-up call");
    }

    @Test
    @SuppressWarnings("unchecked")
    void getGlobal_withTypeFilter_appliesSpec() {
        Page<Activity> page = new PageImpl<>(List.of(sampleActivity));
        when(activityRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        ActivityFilterParams params = new ActivityFilterParams(ActivityType.CALL, null, null, null, 0);
        PageResponse<ActivityDto> result = activityService.getGlobal(params);

        assertThat(result.content()).hasSize(1);
        verify(activityRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void delete_existing_deletesSuccessfully() {
        when(activityRepository.existsById("activity-1")).thenReturn(true);

        activityService.delete("activity-1");

        verify(activityRepository).deleteById("activity-1");
    }

    @Test
    void delete_notFound_throwsApiException() {
        when(activityRepository.existsById(anyString())).thenReturn(false);

        assertThatThrownBy(() -> activityService.delete("nonexistent"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }
}
