package com.aigram.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class CosmosConfig {

    private final AzureConfig azureConfig;

    // Cosmos beans disabled for now - will be enabled when Azure credentials are provided
    // @Bean
    // public CosmosAsyncDatabase cosmosAsyncDatabase() {
    //     return cosmosAsyncClient.getDatabase(azureConfig.getCosmosDatabase());
    // }

    // @Bean
    // public CosmosAsyncContainer cosmosAsyncContainer() {
    //     return cosmosAsyncDatabase().getContainer(azureConfig.getCosmosContainer());
    // }
}
