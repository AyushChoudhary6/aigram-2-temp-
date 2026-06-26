package com.aigram.backend.dto;

import lombok.Data;

@Data
public class SasTokenResponse {
    private boolean success;
    private String sasUrl;
    private String blobName;
    private String containerName;
    private String storageAccountName;
    private String expiresIn;
    private UploadInstructions uploadInstructions;
    
    @Data
    public static class UploadInstructions {
        private String method;
        private String url;
        private Headers headers;
        
        @Data
        public static class Headers {
            private String xMsBlobType;
            private String contentType;
            
            public void setxMsBlobType(String xMsBlobType) {
                this.xMsBlobType = xMsBlobType;
            }
        }
    }
}
