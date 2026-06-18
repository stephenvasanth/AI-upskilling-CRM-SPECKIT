package com.aicrm.module.admin;

import com.aicrm.module.admin.dto.TagAdminDto;
import com.aicrm.module.tag.TagService;
import com.aicrm.module.tag.dto.CreateTagRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tags")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class TagAdminController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagAdminDto>> getAllForAdmin() {
        return ResponseEntity.ok(tagService.getAllForAdmin());
    }

    @PostMapping
    public ResponseEntity<TagAdminDto> create(@Valid @RequestBody CreateTagRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tagService.create(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        tagService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
