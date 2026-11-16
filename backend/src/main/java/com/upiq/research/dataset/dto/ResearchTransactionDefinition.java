package com.upiq.research.dataset.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

/**
 * EXPERIMENTAL: classpath definition of a synthetic transaction.
 * {@code recurring} is research metadata only and is not persisted on the
 * production {@code Transaction} entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ResearchTransactionDefinition {

    private String id;
    @JsonProperty("profile_id")
    private String profileId;
    private BigDecimal amount;
    private String type;
    private String category;
    private String description;
    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;

    /** Research-only metadata. Not a production schema field. */
    private Boolean recurring;
}
