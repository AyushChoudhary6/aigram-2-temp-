package com.aigram.backend.config;

import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.common.StorageSharedKeyCredential;
import com.azure.cosmos.CosmosAsyncClient;
import com.azure.cosmos.CosmosClientBuilder;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Configuration
@ConfigurationProperties(prefix = "azure")
@Data
@Validated
public class AzureConfig {

    private String storageAccountName;

    private String storageAccountKey;

    private String containerName;

    private Integer sasExpiryHours = 24;

    private String cosmosEndpoint;

    private String cosmosKey;

    private String cosmosDatabase;

    private String cosmosContainer;

    @Bean
    public BlobServiceClient blobServiceClient() {
        // Return null for now - will be configured when Azure credentials are provided
        return null;
    }

    @Bean
    public CosmosAsyncClient cosmosAsyncClient() {
        // Return null for now - will be configured when Azure credentials are provided
        return null;
    }
}
