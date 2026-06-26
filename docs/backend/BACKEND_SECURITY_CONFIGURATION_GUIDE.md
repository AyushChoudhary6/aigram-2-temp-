# Backend Security Configuration Guide

## Critical Issue: Authentication Endpoints Blocked

The AIgram backend currently requires authentication for ALL endpoints, including the authentication endpoints themselves. This creates a circular dependency that prevents users from logging in or registering.

## Required Backend Changes

### 1. Spring Security Configuration

The backend needs to configure Spring Security to allow public access to specific authentication endpoints. Here's the required configuration:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(authz -> authz
                // Public authentication endpoints
                .requestMatchers(HttpMethod.POST, "/auth/guest/auth").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/register/send-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/login/send-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/register/verify").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/login/verify").permitAll()
                
                // Public validation endpoints
                .requestMatchers(HttpMethod.POST, "/validation/send-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/validation/verify-otp").permitAll()
                .requestMatchers(HttpMethod.POST, "/validation/validate-phone").permitAll()
                .requestMatchers(HttpMethod.GET, "/validation/otp-status/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/validation/resend-otp").permitAll()
                
                // Public documentation endpoints
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-resources/**").permitAll()
                .requestMatchers("/webjars/**").permitAll()
                
                // Health check endpoints
                .requestMatchers("/actuator/health").permitAll()
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

### 2. CORS Configuration

Ensure CORS is properly configured to allow frontend requests:

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### 3. JWT Filter Configuration

Ensure the JWT filter doesn't block public endpoints:

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
        "/auth/guest/auth",
        "/auth/register/send-otp",
        "/auth/login/send-otp",
        "/auth/register/verify",
        "/auth/login/verify",
        "/validation/send-otp",
        "/validation/verify-otp",
        "/validation/validate-phone",
        "/validation/resend-otp",
        "/swagger-ui",
        "/v3/api-docs",
        "/actuator/health"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        
        // Skip JWT validation for public endpoints
        if (isPublicEndpoint(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Continue with JWT validation for protected endpoints
        // ... existing JWT validation logic
    }
    
    private boolean isPublicEndpoint(String requestPath) {
        return PUBLIC_ENDPOINTS.stream()
            .anyMatch(endpoint -> requestPath.startsWith(endpoint));
    }
}
```

## Testing the Configuration

After implementing these changes, test the authentication flow:

### 1. Test Guest Authentication
```bash
curl -X POST http://localhost:8083/auth/guest/auth \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-device-123","platform":"WEB"}'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "userId": "guest-uuid",
    "name": "Guest User",
    "phoneNumber": null,
    "role": "GUEST",
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresAt": "2024-01-19T12:00:00Z"
  }
}
```

### 2. Test OTP Registration
```bash
curl -X POST http://localhost:8083/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890"}'
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "phoneNumber": "+1234567890",
    "message": "OTP sent successfully",
    "expiryTime": "2024-01-19T12:05:00Z",
    "otpLength": 6
  }
}
```

### 3. Test OTP Login
```bash
curl -X POST http://localhost:8083/auth/login/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890"}'
```

## Verification Checklist

- [ ] Guest authentication endpoint is publicly accessible
- [ ] OTP registration endpoint is publicly accessible  
- [ ] OTP login endpoint is publicly accessible
- [ ] OTP verification endpoints are publicly accessible
- [ ] CORS headers are properly configured
- [ ] JWT filter skips public endpoints
- [ ] Protected endpoints still require authentication
- [ ] Swagger documentation is accessible
- [ ] Health check endpoint is accessible

## Frontend Integration Testing

Once backend changes are deployed, test the frontend integration:

1. **Guest Authentication**: Open the app and try guest login
2. **Registration Flow**: Try registering with a phone number
3. **Login Flow**: Try logging in with existing credentials
4. **Protected Features**: Verify authenticated features work
5. **Token Refresh**: Test automatic token renewal

## Common Issues and Solutions

### Issue: CORS Errors
**Solution**: Ensure CORS configuration allows the frontend origin and required headers.

### Issue: JWT Filter Still Blocking Public Endpoints
**Solution**: Verify the JWT filter's public endpoint list includes all authentication endpoints.

### Issue: OTP Service Not Working
**Solution**: Check OTP service configuration and ensure it's properly initialized.

### Issue: Database Connection Errors
**Solution**: Verify database configuration and ensure tables are properly created.

## Production Considerations

1. **Environment-Specific Configuration**: Use different CORS origins for dev/staging/production
2. **Rate Limiting**: Implement rate limiting for OTP endpoints to prevent abuse
3. **Security Headers**: Add appropriate security headers for production
4. **Logging**: Ensure proper logging for authentication attempts and failures
5. **Monitoring**: Set up monitoring for authentication endpoint health and performance

## Next Steps

1. Implement the security configuration changes in the backend
2. Deploy and test the changes
3. Verify frontend integration works end-to-end
4. Proceed with advanced feature implementation once authentication is working
