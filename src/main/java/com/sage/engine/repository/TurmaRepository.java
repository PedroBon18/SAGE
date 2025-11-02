package com.sage.engine.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sage.engine.model.Turma;

public interface TurmaRepository extends JpaRepository<Turma, Long> {
    
    // Encontra todas as turmas de uma instituição
    List<Turma> findByInstituicao(String instituicao);
    
    // Verifica se uma turma com este nome já existe nesta instituição
    boolean existsByNomeAndInstituicao(String nome, String instituicao);
}