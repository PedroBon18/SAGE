package com.sage.engine.repository; 

import java.util.List; 
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sage.engine.model.Aluno; 

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    Optional<Aluno> findByMatricula(String matricula);

    // Encontra todos os alunos que pertencem a uma instituição específica
    List<Aluno> findAllByInstituicao(String instituicao);
}