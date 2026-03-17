package com.docflow.backand.user.service;

import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.docflow.backand.user.domain.User;
import com.docflow.backand.user.domain.UserRole;
import com.docflow.backand.user.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));
    }

    public User createUser(String email, String fullName, String roleName, String password) {
        UserRole userRole = toUserRole(roleName);
        String passwordHash = toPasswordHash(password);
        User user = new User(email, fullName, userRole, passwordHash);
        return userRepository.save(user);
    }

    private UserRole toUserRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new IllegalArgumentException("Role must not be blank. Allowed values: ADMIN, REVIEWER, AUTHOR.");
        }

        try {
            return UserRole.valueOf(roleName.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid role: " + roleName + ". Allowed values: ADMIN, REVIEWER, AUTHOR.");
        }
    }

    private String toPasswordHash(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password must not be blank.");
        }
        return passwordEncoder.encode(password);
    }
}
