package com.sage.engine.repository; // PACOTE CORRIGIDO

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sage.engine.model.Aluno; // IMPORT CORRIGIDO

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    Optional<Aluno> findByMatricula(String matricula);
}