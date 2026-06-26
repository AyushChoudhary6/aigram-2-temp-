package com.aigram.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class VideoMetadataRequest {
    
    @NotBlank(message = "blobName is required")
    private String blobName;
    
    @NotBlank(message = "userId is required")
    private String userId;
    
    private String title;
    private String description;
    private Integer duration;
    private String thumbnail;
    private List<String> tags;
    private String originalName;
}
