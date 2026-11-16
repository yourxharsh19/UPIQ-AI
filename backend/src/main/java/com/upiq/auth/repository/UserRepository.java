package com.upiq.auth.repository;

import com.upiq.auth.model.User;
import com.upiq.auth.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByGoogleSubject(String googleSubject);
    Optional<User> findByEmailIgnoreCase(String email);
    long countByRole(Role role);
    long countByActiveTrue();
}

