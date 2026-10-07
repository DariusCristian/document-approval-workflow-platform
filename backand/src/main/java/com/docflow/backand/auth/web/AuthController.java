package com.docflow.backand.auth.web;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.docflow.backand.security.UserPrincipal;
import com.docflow.backand.user.domain.User;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final SecurityContextHolderStrategy securityContextHolderStrategy =
            SecurityContextHolder.getContextHolderStrategy();

    public AuthController(AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository) {
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (AuthenticationException exception) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        // Give the logged-in user a new session ID, so an ID known before login is useless (session fixation).
        if (httpRequest.getSession(false) != null) {
            httpRequest.changeSessionId();
        }

        // Spring Security does not save logins made in our own controller, so store the user in the session here.
        SecurityContext context = securityContextHolderStrategy.createEmptyContext();
        context.setAuthentication(authentication);
        securityContextHolderStrategy.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        User user = ((UserPrincipal) authentication.getPrincipal()).getUser();
        return new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.getRoleName(),
                "Login successful");
    }

    @GetMapping("/me")
    public CurrentUserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        return new CurrentUserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRoleName());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        securityContextHolderStrategy.clearContext();
        return ResponseEntity.noContent().build();
    }
}
