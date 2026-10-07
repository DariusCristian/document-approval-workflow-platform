package com.docflow.backend.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;

import jakarta.servlet.http.HttpServletResponse;

import com.docflow.backend.security.CustomUserDetailsService;

@Configuration
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(CustomUserDetailsService customUserDetailsService) {
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            SecurityContextRepository securityContextRepository,
            CsrfTokenRepository csrfTokenRepository) throws Exception {
        http
            .userDetailsService(customUserDetailsService)
            // SPA mode: the token is in a JavaScript-readable XSRF-TOKEN cookie and comes back in an X-XSRF-TOKEN header.
            .csrf(csrf -> csrf.spa().csrfTokenRepository(csrfTokenRepository))
            // Don't remember rejected requests in a new session (that is only useful for login-page redirects).
            .requestCache(requestCache -> requestCache.requestCache(new NullRequestCache()))
            .securityContext(securityContext -> securityContext.securityContextRepository(securityContextRepository))
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                // Spring forwards errors (e.g. 404) to /error; without this they would turn into 401.
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(jsonUnauthorizedEntryPoint())
                .accessDeniedHandler(jsonAccessDeniedHandler()));

        return http.build();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    // Same settings as csrf.spa(), as a bean so AuthController can issue a new token on login and logout.
    @Bean
    public CsrfTokenRepository csrfTokenRepository() {
        return CookieCsrfTokenRepository.withHttpOnlyFalse();
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
        return (request, response, authException) ->
                writeJsonError(response, HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    // Rejected by Spring Security (in practice: a missing or wrong CSRF token): our usual JSON 403.
    private AccessDeniedHandler jsonAccessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            String message = accessDeniedException instanceof CsrfException
                    ? "Invalid or missing CSRF token. Please reload the page and try again."
                    : "Access denied";
            writeJsonError(response, HttpStatus.FORBIDDEN, message);
        };
    }

    private void writeJsonError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"status\":" + status.value() + ",\"message\":\"" + message + "\"}");
    }
}
