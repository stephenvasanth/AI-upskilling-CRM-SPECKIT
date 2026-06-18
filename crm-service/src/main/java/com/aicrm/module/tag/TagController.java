package com.aicrm.module.tag;

import com.aicrm.module.tag.dto.TagDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public List<TagDto> getAll() {
        return tagService.getAll();
    }
}
