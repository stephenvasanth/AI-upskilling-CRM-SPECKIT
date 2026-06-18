package com.aicrm.module.auth.dto;

public record LoginResponse(String token, UserDto user) {}
