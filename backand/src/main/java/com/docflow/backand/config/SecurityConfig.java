package com.docflow.backand.config;

import java.nio.charset.StandardCharsets;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;

import com.docflow.backand.security.CustomUserDetailsService;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            SecurityContextRepository securityContextRepository) throws Exception {
        http
            .userDetailsService(customUserDetailsService)
            .csrf(AbstractHttpConfigurer::disable)
            // Don't remember rejected requests in a new session (that is only useful for login-page redirects).
            .requestCache(requestCache -> requestCache.requestCache(new NullRequestCache()))
            .securityContext(securityContext -> securityContext.securityContextRepository(securityContextRepository))
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                // Spring forwards errors (e.g. 404) to /error; without this they would turn into 401.
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(jsonUnauthorizedEntryPoint()));

        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration)
            throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // Not logged in: answer with our usual JSON error instead of Spring's default 403 or login page.
    private AuthenticationEntryPoint jsonUnauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":401,\"message\":\"Authentication required\"}");
        };
    }
}
