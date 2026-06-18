package com.aicrm.module.deal;

import com.aicrm.module.deal.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deals")
@RequiredArgsConstructor
public class DealController {

    private final DealService dealService;

    @GetMapping("/board")
    public DealBoardDto getBoard() {
        return dealService.getBoardGroupedByStage();
    }

    @GetMapping("/by-contact/{contactId}")
    public List<DealDto> getByContact(@PathVariable String contactId) {
        return dealService.getByContactId(contactId);
    }

    @GetMapping("/{id}")
    public DealDto getById(@PathVariable String id) {
        return dealService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DealDto create(@Valid @RequestBody CreateDealRequest request) {
        return dealService.create(request);
    }

    @PutMapping("/{id}")
    public DealDto update(@PathVariable String id,
                          @Valid @RequestBody UpdateDealRequest request) {
        return dealService.update(id, request);
    }

    @PatchMapping("/{id}/stage")
    public DealDto moveStage(@PathVariable String id,
                             @Valid @RequestBody MoveStageRequest request) {
        return dealService.moveStage(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        dealService.delete(id);
    }
}
