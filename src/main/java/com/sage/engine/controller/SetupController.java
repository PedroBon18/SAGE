package com.sage.engine.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.model.Aluno;
import com.sage.engine.repository.AlunoRepository;

@RestController
@RequestMapping("/api/setup")
public class SetupController {

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/test-aluno")
    public ResponseEntity<String> setupTestAluno() {
        return alunoRepository.findByMatricula("joao.test")
            .map(aluno -> {
                // Atualiza a turma e senha
                aluno.setTurma("1A");
                aluno.setPassword(passwordEncoder.encode("senha123"));
                
                alunoRepository.save(aluno);
                return ResponseEntity.ok("Aluno atualizado com sucesso!");
            })
            .orElseGet(() -> {
                // Se o aluno não existe, cria um novo
                Aluno novoAluno = new Aluno();
                novoAluno.setNome("João Aluno Test");
                novoAluno.setMatricula("joao.test");
                novoAluno.setPassword(passwordEncoder.encode("senha123"));
                novoAluno.setTurma("1A");
                novoAluno.setInstituicao("SAGE");
                
                alunoRepository.save(novoAluno);
                return ResponseEntity.ok("Aluno criado com sucesso!");
            });
    }
}