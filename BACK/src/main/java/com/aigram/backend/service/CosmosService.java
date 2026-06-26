package com.aigram.backend.service;

import com.aigram.backend.dto.VideoMetadataRequest;
import com.aigram.backend.dto.VideoMetadataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CosmosService {

    public Mono<VideoMetadataResponse> createVideoMetadata(VideoMetadataRequest request, String blobUrl) {
        try {
            VideoMetadataResponse metadata = new VideoMetadataResponse();
            String videoId = UUID.randomUUID().toString();
            Instant timestamp = Instant.now();

            metadata.setId(videoId);
            metadata.setVideoId(videoId);
            metadata.setUserId(request.getUserId());
            metadata.setOriginalName(request.getOriginalName() != null ? request.getOriginalName() : 
                request.getTitle() != null ? request.getTitle() : "Untitled Video");
            metadata.setBlobUrl(blobUrl);
            metadata.setUploadedAt(timestamp);
            metadata.setBlobName(request.getBlobName());
            metadata.setTitle(request.getTitle() != null ? request.getTitle() : "Untitled Video");
            metadata.setDescription(request.getDescription() != null ? request.getDescription() : "");
            metadata.setDuration(request.getDuration() != null ? request.getDuration() : 0);
            metadata.setThumbnail(request.getThumbnail());
            metadata.setTags(request.getTags() != null ? request.getTags() : List.of());
            metadata.setStatus("uploaded");
            metadata.setUpdatedAt(timestamp);
            metadata.setViews(0);
            metadata.setLikes(0);
            metadata.setSize(0L);
            metadata.setFormat("mp4");
            metadata.setCloudProvider("Azure Blob Storage");

            VideoMetadataResponse.VideoMetadata videoMetadata = new VideoMetadataResponse.VideoMetadata();
            videoMetadata.setCreatedBy("Aigram Backend v1.0");
            videoMetadata.setUploadSource("Web/Mobile");
            videoMetadata.setProcessingStatus("pending");
            metadata.setMetadata(videoMetadata);

            log.debug("Created video metadata for videoId: {}, userId: {}", videoId, request.getUserId());
            return Mono.just(metadata);

        } catch (Exception e) {
            log.error("Error creating video metadata for userId: {}", request.getUserId(), e);
            return Mono.error(new RuntimeException("Failed to create video metadata", e));
        }
    }
}
