package com.aigram.backend.service;

import com.aigram.backend.config.AzureConfig;
import com.aigram.backend.dto.SasTokenResponse;
import com.azure.storage.blob.BlobServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@Slf4j
public class AzureStorageService {

    private final AzureConfig azureConfig;
    private final BlobServiceClient blobServiceClient;

    public AzureStorageService(AzureConfig azureConfig) {
        this.azureConfig = azureConfig;
        this.blobServiceClient = null; // Will be injected when available
    }

    public String generateBlobName(String folder, String fileName, String videoId) {
        if (videoId != null && !videoId.isEmpty()) {
            return videoId;
        }
        
        String baseFolder = folder != null && !folder.isEmpty() ? folder : "default";
        return String.format("%s/%d_%s_%s", 
            baseFolder, 
            System.currentTimeMillis(), 
            UUID.randomUUID().toString().replace("-", ""),
            fileName);
    }

    public SasTokenResponse generateSasToken(String fileName, String videoId, String userId, String folder) {
        try {
            String blobName = generateBlobName(folder, fileName, videoId);
            
            // Handle null blobServiceClient
            if (blobServiceClient == null) {
                SasTokenResponse response = new SasTokenResponse();
                response.setSuccess(false);
                response.setBlobName(blobName);
                response.setExpiresIn("0 hours");
                return response;
            }
            
            String containerName = azureConfig.getContainerName();
            String accountName = azureConfig.getStorageAccountName();
            Integer expiryHours = azureConfig.getSasExpiryHours();

            SasTokenResponse response = new SasTokenResponse();
            response.setSuccess(true);
            response.setSasUrl("https://placeholder-sas-url");
            response.setBlobName(blobName);
            response.setContainerName(containerName);
            response.setStorageAccountName(accountName);
            response.setExpiresIn(expiryHours + " hours");

            SasTokenResponse.UploadInstructions uploadInstructions = new SasTokenResponse.UploadInstructions();
            uploadInstructions.setMethod("PUT");
            uploadInstructions.setUrl("https://placeholder-sas-url");

            SasTokenResponse.UploadInstructions.Headers headers = new SasTokenResponse.UploadInstructions.Headers();
            headers.setxMsBlobType("BlockBlob");
            headers.setContentType("video/mp4");
            uploadInstructions.setHeaders(headers);

            response.setUploadInstructions(uploadInstructions);

            log.debug("Generated SAS token for blob: {}", blobName);
            return response;

        } catch (Exception e) {
            log.error("Error generating SAS token for fileName: {}, userId: {}", fileName, userId, e);
            throw new RuntimeException("Failed to generate SAS token", e);
        }
    }
}
