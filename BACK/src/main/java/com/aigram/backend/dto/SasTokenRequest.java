package com.aigram.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SasTokenRequest {
    
    @NotBlank(message = "fileName is required")
    private String fileName;
    
    private String videoId;
    
    @NotBlank(message = "userId is required")
    private String userId;
    
    private String folder;
}
