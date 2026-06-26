package com.aigram.backend.service;

import com.aigram.backend.dto.SasTokenRequest;
import com.aigram.backend.dto.SasTokenResponse;
import com.aigram.backend.dto.VideoMetadataRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

@Service
@Slf4j
public class UploadService {

    private final AzureStorageService azureStorageService;

    public UploadService(AzureStorageService azureStorageService) {
        this.azureStorageService = azureStorageService;
    }

    public Mono<SasTokenResponse> generateSasToken(SasTokenRequest request) {
        try {
            log.debug("Generating SAS token for fileName: {}, userId: {}", request.getFileName(), request.getUserId());
            
            SasTokenResponse response = azureStorageService.generateSasToken(
                request.getFileName(),
                request.getVideoId(),
                request.getUserId(),
                request.getFolder()
            );

            return Mono.just(response);

        } catch (Exception e) {
            log.error("Error generating SAS token for fileName: {}, userId: {}", 
                request.getFileName(), request.getUserId(), e);
            return Mono.error(new RuntimeException("Failed to generate SAS token", e));
        }
    }

    public Mono<Map<String, Object>> storeVideoMetadata(VideoMetadataRequest request) {
        try {
            log.debug("Storing video metadata for blobName: {}, userId: {}", 
                request.getBlobName(), request.getUserId());

            // Return placeholder response for now
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Video metadata stored successfully");
            
            Map<String, Object> videoData = new HashMap<>();
            videoData.put("videoId", "placeholder-video-id");
            videoData.put("userId", request.getUserId());
            videoData.put("originalName", request.getOriginalName());
            videoData.put("blobUrl", "https://placeholder.blob.url");
            videoData.put("uploadedAt", java.time.Instant.now().toString());
            
            response.put("video", videoData);
            
            log.debug("Stored video metadata for videoId: {}, userId: {}", 
                "placeholder-video-id", request.getUserId());
            
            return Mono.just(response)
                .onErrorResume(throwable -> {
                    log.error("Error storing video metadata for blobName: {}, userId: {}", 
                        request.getBlobName(), request.getUserId(), throwable);
                    return Mono.error(new RuntimeException("Failed to store video metadata", throwable));
                });

        } catch (Exception e) {
            log.error("Error storing video metadata for blobName: {}, userId: {}", 
                request.getBlobName(), request.getUserId(), e);
            return Mono.error(new RuntimeException("Failed to store video metadata", e));
        }
    }

    public Mono<Map<String, Object>> getVideoMetadata(String videoId, String userId) {
        // Placeholder implementation to keep frontend wiring functional locally.
        // A real implementation would fetch from Cosmos DB and validate user access.
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Video not found");
        response.put("videoId", videoId);
        if (userId != null) {
            response.put("userId", userId);
        }
        return Mono.just(response);
    }

    public Mono<Map<String, Object>> updateVideoMetadata(String videoId, String userId, 
                                                         String title, String description, 
                                                         List<String> tags, String thumbnail) {
        // Placeholder implementation to keep frontend wiring functional locally.
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Video metadata updated (placeholder)");
        response.put("videoId", videoId);
        response.put("userId", userId);
        if (title != null) response.put("title", title);
        if (description != null) response.put("description", description);
        if (tags != null) response.put("tags", tags);
        if (thumbnail != null) response.put("thumbnail", thumbnail);
        return Mono.just(response);
    }

    public Mono<Map<String, Object>> softDeleteVideo(String videoId, String userId) {
        // Placeholder implementation to keep frontend wiring functional locally.
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Video deleted (placeholder)");
        response.put("videoId", videoId);
        response.put("userId", userId);
        return Mono.just(response);
    }

    public Mono<Map<String, Object>> getUserVideos(String userId) {
        // Placeholder implementation to keep frontend wiring functional locally.
        // Frontend expects a list-like structure; we return a stable shape.
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "User videos fetched (placeholder)");
        response.put("userId", userId);
        response.put("videos", new ArrayList<>());
        return Mono.just(response);
    }

    public Mono<Map<String, Object>> getFolderVideos(String folderName) {
        // Placeholder implementation to keep frontend wiring functional locally.
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Folder videos fetched (placeholder)");
        response.put("folderName", folderName);
        response.put("videos", new ArrayList<>());
        return Mono.just(response);
    }
}
