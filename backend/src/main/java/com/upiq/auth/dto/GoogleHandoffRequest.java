package com.upiq.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleHandoffRequest(@NotBlank @Size(max = 128) String code) { }
