package com.sage.engine.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sage.engine.model.Professor;

public interface ProfessorRepository extends JpaRepository<Professor, Long> {
    
    // O Spring Security vai usar isto para encontrar o utilizador pelo nome
    Optional<Professor> findByUsername(String username);
}