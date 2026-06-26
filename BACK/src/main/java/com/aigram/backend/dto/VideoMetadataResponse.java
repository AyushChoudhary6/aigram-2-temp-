package com.aigram.backend.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class VideoMetadataResponse {
    private String id;
    private String videoId;
    private String userId;
    private String originalName;
    private String blobUrl;
    private Instant uploadedAt;
    private String blobName;
    private String title;
    private String description;
    private Integer duration;
    private String thumbnail;
    private List<String> tags;
    private String status;
    private Instant updatedAt;
    private Integer views;
    private Integer likes;
    private Long size;
    private String format;
    private String cloudProvider;
    private String storageAccount;
    private String container;
    private VideoMetadata metadata;
    private Instant deletedAt;
    
    @Data
    public static class VideoMetadata {
        private String createdBy;
        private String uploadSource;
        private String processingStatus;
    }
}
