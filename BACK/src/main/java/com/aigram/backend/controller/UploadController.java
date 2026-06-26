package com.aigram.backend.controller;

import com.aigram.backend.dto.SasTokenRequest;
import com.aigram.backend.dto.SasTokenResponse;
import com.aigram.backend.dto.VideoMetadataRequest;
import com.aigram.backend.service.UploadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Validated
@Slf4j
public class UploadController {

    private final UploadService uploadService;

    @PostMapping("/sas-token")
    public Mono<ResponseEntity<SasTokenResponse>> generateSasToken(@Valid @RequestBody SasTokenRequest request) {
        return uploadService.generateSasToken(request)
            .map(response -> ResponseEntity.ok(response))
            .onErrorResume(throwable -> {
                log.error("Error generating SAS token", throwable);
                return Mono.just(ResponseEntity.badRequest().build());
            });
    }

    @PostMapping("/video")
    public Mono<ResponseEntity<Map<String, Object>>> storeVideoMetadata(@Valid @RequestBody VideoMetadataRequest request) {
        return uploadService.storeVideoMetadata(request)
            .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response))
            .onErrorResume(throwable -> {
                log.error("Error storing video metadata", throwable);
                if (throwable instanceof RuntimeException && throwable.getMessage().contains("required")) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Missing required fields");
                    errorResponse.put("required", List.of("blobName", "userId"));
                    errorResponse.put("message", "blobName and userId are required");
                    return Mono.just(ResponseEntity.badRequest().body(errorResponse));
                }
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }

    @GetMapping("/metadata/{videoId}")
    public Mono<ResponseEntity<Map<String, Object>>> getVideoMetadata(
            @PathVariable String videoId,
            @RequestParam(required = false) String userId) {
        
        if (videoId == null || videoId.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Missing videoId parameter");
            errorResponse.put("message", "videoId is required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return uploadService.getVideoMetadata(videoId, userId)
            .map(response -> ResponseEntity.ok(response))
            .onErrorResume(throwable -> {
                log.error("Error retrieving video metadata for videoId: {}", videoId, throwable);
                if (throwable instanceof RuntimeException && throwable.getMessage().contains("not found")) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Video not found");
                    errorResponse.put("videoId", videoId);
                    return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse));
                }
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }

    @PutMapping("/metadata/{videoId}")
    public Mono<ResponseEntity<Map<String, Object>>> updateVideoMetadata(
            @PathVariable String videoId,
            @RequestBody Map<String, Object> requestBody) {
        
        String userId = (String) requestBody.get("userId");
        String title = (String) requestBody.get("title");
        String description = (String) requestBody.get("description");
        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) requestBody.get("tags");
        String thumbnail = (String) requestBody.get("thumbnail");

        if (videoId == null || videoId.trim().isEmpty() || userId == null || userId.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Missing required fields");
            errorResponse.put("required", List.of("videoId in URL", "userId in body"));
            errorResponse.put("message", "Both videoId and userId are required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return uploadService.updateVideoMetadata(videoId, userId, title, description, tags, thumbnail)
            .map(response -> ResponseEntity.ok(response))
            .onErrorResume(throwable -> {
                log.error("Error updating video metadata for videoId: {}", videoId, throwable);
                if (throwable instanceof RuntimeException && throwable.getMessage().contains("not found")) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Video not found");
                    errorResponse.put("videoId", videoId);
                    return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse));
                }
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }

    @DeleteMapping("/metadata/{videoId}")
    public Mono<ResponseEntity<Map<String, Object>>> deleteVideoMetadata(
            @PathVariable String videoId,
            @RequestBody Map<String, String> requestBody) {
        
        String userId = requestBody.get("userId");

        if (videoId == null || videoId.trim().isEmpty() || userId == null || userId.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Missing required fields");
            errorResponse.put("required", List.of("videoId in URL", "userId in body"));
            errorResponse.put("message", "Both videoId and userId are required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return uploadService.softDeleteVideo(videoId, userId)
            .map(response -> ResponseEntity.ok(response))
            .onErrorResume(throwable -> {
                log.error("Error deleting video metadata for videoId: {}", videoId, throwable);
                if (throwable instanceof RuntimeException && throwable.getMessage().contains("not found")) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "Video not found");
                    errorResponse.put("videoId", videoId);
                    return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse));
                }
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }

    @GetMapping("/user/{userId}/videos")
    public Mono<ResponseEntity<Map<String, Object>>> getUserVideos(@PathVariable String userId) {
        
        if (userId == null || userId.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Missing userId parameter");
            errorResponse.put("message", "userId is required");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return uploadService.getUserVideos(userId)
            .map(response -> ResponseEntity.ok(response))
            .onErrorResume(throwable -> {
                log.error("Error retrieving videos for userId: {}", userId, throwable);
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }

    @GetMapping("/folder/{folderName}")
    public Mono<ResponseEntity<Map<String, Object>>> getFolderVideos(@PathVariable String folderName) {
        
        if (folderName == null || folderName.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Missing folderName parameter");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return uploadService.getFolderVideos(folderName)
            .map(response -> ResponseEntity.ok(response))
            .onErrorResume(throwable -> {
                log.error("Error retrieving videos for folder: {}", folderName, throwable);
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }

    /**
     * Folder listing endpoint that supports folder names containing '/' without relying on encoded slashes in the path.
     * Example: GET /api/upload/folder?folderName=profile/user-123/photos
     */
    @GetMapping("/folder")
    public Mono<ResponseEntity<Map<String, Object>>> getFolderVideosByQuery(@RequestParam String folderName) {
        if (folderName == null || folderName.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Missing folderName parameter");
            return Mono.just(ResponseEntity.badRequest().body(errorResponse));
        }

        return uploadService.getFolderVideos(folderName)
            .map(response -> ResponseEntity.ok(response))
            .onErrorResume(throwable -> {
                log.error("Error retrieving videos for folder (query): {}", folderName, throwable);
                return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
            });
    }
}
