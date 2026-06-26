package com.aigram.backend.config;

import org.springframework.context.annotation.Configuration;

@Configuration
// Redis configuration disabled for now - will be enabled when Redis is available
// @EnableCaching
public class RedisConfig {

    // Redis beans disabled for now - will be enabled when Redis is available
    // @Bean
    // public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
    //     RedisTemplate<String, Object> template = new RedisTemplate<>();
    //     template.setConnectionFactory(connectionFactory);
    //     
    //     template.setKeySerializer(new StringRedisSerializer());
    //     template.setHashKeySerializer(new StringRedisSerializer());
    //     
    //     template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
    //     template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
    //     
    //     template.afterPropertiesSet();
    //     return template;
    // }
}
