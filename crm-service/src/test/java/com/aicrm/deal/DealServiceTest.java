package com.aicrm.deal;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.contact.Contact;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.deal.Deal;
import com.aicrm.module.deal.DealRepository;
import com.aicrm.module.deal.DealService;
import com.aicrm.module.deal.DealStage;
import com.aicrm.module.deal.dto.*;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DealServiceTest {

    @Mock private DealRepository dealRepository;
    @Mock private ContactRepository contactRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private DealService dealService;

    private Deal sampleDeal;
    private Contact sampleContact;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleContact = new Contact();
        sampleContact.setId("contact-1");
        sampleContact.setFirstName("Alice");
        sampleContact.setLastName("Walker");

        sampleUser = new User();
        sampleUser.setId("user-1");
        sampleUser.setDisplayName("Bob Seller");

        sampleDeal = new Deal();
        sampleDeal.setId("deal-1");
        sampleDeal.setTitle("Big Sale");
        sampleDeal.setValue(new BigDecimal("5000.00"));
        sampleDeal.setStage(DealStage.LEAD);
        sampleDeal.setExpectedCloseDate(LocalDate.of(2026, 12, 31));
        sampleDeal.setContact(sampleContact);
        sampleDeal.setOwner(sampleUser);
        sampleDeal.setNotes("Hot lead");
    }

    @Test
    void getBoard_returnsGroupedByStage() {
        when(dealRepository.findAllByOrderByCreatedAtAsc()).thenReturn(List.of(sampleDeal));

        DealBoardDto board = dealService.getBoardGroupedByStage();

        assertThat(board.stages()).containsKey("LEAD");
        assertThat(board.stages().get("LEAD")).hasSize(1);
        assertThat(board.stages().get("LEAD").get(0).title()).isEqualTo("Big Sale");
        assertThat(board.stages()).containsKey("QUALIFIED");
        assertThat(board.stages().get("QUALIFIED")).isEmpty();
    }

    @Test
    void getById_found_returnsDto() {
        when(dealRepository.findById("deal-1")).thenReturn(Optional.of(sampleDeal));

        DealDto dto = dealService.getById("deal-1");

        assertThat(dto.id()).isEqualTo("deal-1");
        assertThat(dto.title()).isEqualTo("Big Sale");
        assertThat(dto.contactName()).isEqualTo("Alice Walker");
        assertThat(dto.ownerName()).isEqualTo("Bob Seller");
    }

    @Test
    void getById_notFound_throwsApiException() {
        when(dealRepository.findById(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dealService.getById("nonexistent"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void create_withMinimalRequest_savesAndReturnsDto() {
        when(contactRepository.findById("contact-1")).thenReturn(Optional.of(sampleContact));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(sampleUser));
        when(dealRepository.save(any(Deal.class))).thenReturn(sampleDeal);

        CreateDealRequest req = new CreateDealRequest(
            "Big Sale", DealStage.LEAD, new BigDecimal("5000.00"),
            LocalDate.of(2026, 12, 31), "contact-1", "user-1", "Hot lead"
        );
        DealDto result = dealService.create(req);

        assertThat(result.title()).isEqualTo("Big Sale");
        verify(dealRepository).save(any(Deal.class));
    }

    @Test
    void update_existingDeal_updatesAndReturnsDto() {
        when(dealRepository.findById("deal-1")).thenReturn(Optional.of(sampleDeal));
        when(dealRepository.save(any(Deal.class))).thenReturn(sampleDeal);

        UpdateDealRequest req = new UpdateDealRequest(
            "Updated Deal", DealStage.QUALIFIED, null, null, null, null, null
        );
        DealDto result = dealService.update("deal-1", req);

        assertThat(result).isNotNull();
        verify(dealRepository).save(sampleDeal);
    }

    @Test
    void update_notFound_throwsApiException() {
        when(dealRepository.findById(anyString())).thenReturn(Optional.empty());

        UpdateDealRequest req = new UpdateDealRequest("X", null, null, null, null, null, null);
        assertThatThrownBy(() -> dealService.update("nonexistent", req))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void moveStage_existingDeal_changesStage() {
        when(dealRepository.findById("deal-1")).thenReturn(Optional.of(sampleDeal));
        when(dealRepository.save(any(Deal.class))).thenAnswer(inv -> inv.getArgument(0));

        MoveStageRequest req = new MoveStageRequest(DealStage.QUALIFIED);
        DealDto result = dealService.moveStage("deal-1", req);

        assertThat(sampleDeal.getStage()).isEqualTo(DealStage.QUALIFIED);
        verify(dealRepository).save(sampleDeal);
    }

    @Test
    void moveStage_notFound_throwsApiException() {
        when(dealRepository.findById(anyString())).thenReturn(Optional.empty());

        MoveStageRequest req = new MoveStageRequest(DealStage.QUALIFIED);
        assertThatThrownBy(() -> dealService.moveStage("nonexistent", req))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void delete_existingDeal_deletesSuccessfully() {
        when(dealRepository.existsById("deal-1")).thenReturn(true);

        dealService.delete("deal-1");

        verify(dealRepository).deleteById("deal-1");
    }

    @Test
    void delete_notFound_throwsApiException() {
        when(dealRepository.existsById(anyString())).thenReturn(false);

        assertThatThrownBy(() -> dealService.delete("nonexistent"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }
}
