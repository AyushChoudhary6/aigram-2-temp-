package com.aigram.backend.controller;

import com.aigram.backend.config.AzureConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class HealthController {

    private final AzureConfig azureConfig;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("timestamp", Instant.now().toString());
        response.put("service", "aigram-video-upload-backend");
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "operational");
        response.put("timestamp", Instant.now().toString());
        response.put("environment", System.getProperty("spring.profiles.active", "default"));
        
        Map<String, Object> features = new HashMap<>();
        features.put("videoUpload", true);
        features.put("blobStorage", azureConfig.getStorageAccountName() != null && !azureConfig.getStorageAccountName().isEmpty());
        features.put("cosmosDb", azureConfig.getCosmosEndpoint() != null && !azureConfig.getCosmosEndpoint().isEmpty());
        
        response.put("features", features);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Aigram Video Upload Backend API");
        response.put("version", "1.0.0");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("health", "GET /health");
        endpoints.put("status", "GET /api/status");
        endpoints.put("uploadVideo", "POST /api/upload/video");
        endpoints.put("generateSas", "POST /api/upload/sas-token");
        endpoints.put("getMetadata", "GET /api/upload/metadata/:videoId");
        endpoints.put("updateMetadata", "PUT /api/upload/metadata/:videoId");
        endpoints.put("deleteMetadata", "DELETE /api/upload/metadata/:videoId");
        endpoints.put("getUserVideos", "GET /api/upload/user/:userId/videos");
        endpoints.put("getFolderVideos", "GET /api/upload/folder/:folderName");
        
        response.put("endpoints", endpoints);
        
        return ResponseEntity.ok(response);
    }
}
