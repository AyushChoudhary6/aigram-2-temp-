package com.aigram.backend;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableRetry
@EnableTransactionManagement
@Slf4j
public class AigramBackendApplication {

    public static void main(String[] args) {
        printStartupBanner();
        SpringApplication.run(AigramBackendApplication.class, args);
    }

    private static void printStartupBanner() {
        System.out.println("""
            ╔═══════════════════════════════════════════════════════════╗
            ║     Aigram Video Upload Backend Server Starting...        ║
            ╠═══════════════════════════════════════════════════════════╣
            ║ Framework: Spring Boot 3.5.0                              ║
            ║ Java Version: 21                                           ║
            ║ Build Tool: Maven                                          ║
            ╚═══════════════════════════════════════════════════════════╝
            """);
        
        log.info("Starting Aigram Video Upload Backend...");
        log.info("Spring Boot Application");
        log.info("Java Version: {}", System.getProperty("java.version"));
        log.info("Spring Boot Version: {}", SpringBootApplication.class.getPackage().getImplementationVersion());
    }
}
