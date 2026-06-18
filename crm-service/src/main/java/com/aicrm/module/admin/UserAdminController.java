package com.aicrm.module.admin;

import com.aicrm.module.admin.dto.CreateUserRequest;
import com.aicrm.module.admin.dto.UpdateUserRoleRequest;
import com.aicrm.module.admin.dto.UpdateUserStatusRequest;
import com.aicrm.module.admin.dto.UserAdminDto;
import com.aicrm.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ResponseEntity<List<UserAdminDto>> listAll() {
        return ResponseEntity.ok(userAdminService.listAll());
    }

    @PostMapping
    public ResponseEntity<UserAdminDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userAdminService.createUser(request));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserAdminDto> updateRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userAdminService.updateRole(id, request, principal.getUserId()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserAdminDto> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userAdminService.updateStatus(id, request, principal.getUserId()));
    }
}
