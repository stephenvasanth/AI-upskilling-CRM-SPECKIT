package com.aicrm.tag;

import com.aicrm.common.exception.ApiException;
import com.aicrm.common.exception.ErrorCode;
import com.aicrm.module.admin.dto.TagAdminDto;
import com.aicrm.module.tag.Tag;
import com.aicrm.module.tag.TagRepository;
import com.aicrm.module.tag.TagService;
import com.aicrm.module.tag.dto.CreateTagRequest;
import com.aicrm.module.tag.dto.TagDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock private TagRepository tagRepository;

    @InjectMocks private TagService tagService;

    private Tag sampleTag;

    @BeforeEach
    void setUp() {
        sampleTag = new Tag();
        sampleTag.setId("tag-1");
        sampleTag.setName("VIP");
        sampleTag.setColour("#3b82f6");
        sampleTag.setCreatedAt(Instant.now());
    }

    @Test
    void getAll_returnsSimpleDtos() {
        when(tagRepository.findAllByOrderByNameAsc()).thenReturn(List.of(sampleTag));

        List<TagDto> result = tagService.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("VIP");
        assertThat(result.get(0).colour()).isEqualTo("#3b82f6");
    }

    @Test
    void getAllForAdmin_includesContactCount() {
        when(tagRepository.findAllByOrderByNameAsc()).thenReturn(List.of(sampleTag));
        when(tagRepository.countContactsPerTag()).thenReturn(List.<Object[]>of(new Object[]{"tag-1", 3L}));

        List<TagAdminDto> result = tagService.getAllForAdmin();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).contactCount()).isEqualTo(3L);
        assertThat(result.get(0).createdAt()).isNotNull();
    }

    @Test
    void getAllForAdmin_tagWithNoContacts_returnsZeroCount() {
        when(tagRepository.findAllByOrderByNameAsc()).thenReturn(List.of(sampleTag));
        when(tagRepository.countContactsPerTag()).thenReturn(List.of());

        List<TagAdminDto> result = tagService.getAllForAdmin();

        assertThat(result.get(0).contactCount()).isEqualTo(0L);
    }

    @Test
    void create_savesAndReturnsDto() {
        when(tagRepository.save(any(Tag.class))).thenAnswer(inv -> {
            Tag t = inv.getArgument(0);
            t.setId("tag-new");
            t.setCreatedAt(Instant.now());
            return t;
        });

        CreateTagRequest req = new CreateTagRequest("Premium", "#22c55e");
        TagAdminDto result = tagService.create(req);

        assertThat(result.name()).isEqualTo("Premium");
        assertThat(result.colour()).isEqualTo("#22c55e");
        assertThat(result.contactCount()).isEqualTo(0L);
        verify(tagRepository).save(any(Tag.class));
    }

    @Test
    void delete_existingTag_deletesSuccessfully() {
        when(tagRepository.existsById("tag-1")).thenReturn(true);

        tagService.delete("tag-1");

        verify(tagRepository).deleteById("tag-1");
    }

    @Test
    void delete_nonExistentTag_throwsNotFound() {
        when(tagRepository.existsById("bad-id")).thenReturn(false);

        assertThatThrownBy(() -> tagService.delete("bad-id"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND);
    }
}
