package com.aicrm.module.company;

import com.aicrm.module.company.dto.CompanyDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Cacheable("companies::list")
    public List<CompanyDto> getAll() {
        return companyRepository.findAll().stream()
            .map(c -> new CompanyDto(c.getId(), c.getName()))
            .toList();
    }
}
