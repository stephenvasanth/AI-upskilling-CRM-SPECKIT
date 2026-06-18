package com.aicrm.module.tag;

import com.aicrm.common.exception.ApiException;
import com.aicrm.module.admin.dto.TagAdminDto;
import com.aicrm.module.tag.dto.CreateTagRequest;
import com.aicrm.module.tag.dto.TagDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    @Cacheable("tags::list")
    public List<TagDto> getAll() {
        return tagRepository.findAllByOrderByNameAsc().stream()
            .map(t -> new TagDto(t.getId(), t.getName(), t.getColour()))
            .toList();
    }

    public List<TagAdminDto> getAllForAdmin() {
        Map<String, Long> countMap = tagRepository.countContactsPerTag().stream()
            .collect(Collectors.toMap(
                row -> (String) row[0],
                row -> ((Number) row[1]).longValue()
            ));
        return tagRepository.findAllByOrderByNameAsc().stream()
            .map(t -> new TagAdminDto(
                t.getId(),
                t.getName(),
                t.getColour(),
                countMap.getOrDefault(t.getId(), 0L),
                t.getCreatedAt()
            ))
            .toList();
    }

    @CacheEvict(value = "tags::list", allEntries = true)
    @Transactional
    public TagAdminDto create(CreateTagRequest request) {
        Tag tag = new Tag();
        tag.setName(request.name());
        tag.setColour(request.colour());
        Tag saved = tagRepository.save(tag);
        return new TagAdminDto(saved.getId(), saved.getName(), saved.getColour(), 0L, saved.getCreatedAt());
    }

    @CacheEvict(value = "tags::list", allEntries = true)
    @Transactional
    public void delete(String id) {
        if (!tagRepository.existsById(id)) {
            throw ApiException.notFound("Tag");
        }
        tagRepository.deleteById(id);
    }
}
