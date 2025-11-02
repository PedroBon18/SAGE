package com.sage.engine.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.model.Professor;
import com.sage.engine.model.Turma;
import com.sage.engine.repository.ProfessorRepository;
import com.sage.engine.repository.TurmaRepository;

@RestController
@RequestMapping("/api/turmas")
@CrossOrigin(origins = "*")
public class TurmaController {

    @Autowired
    private TurmaRepository turmaRepository;
    
    @Autowired
    private ProfessorRepository professorRepository;

    /**
     * Retorna a lista de turmas (ex: [{"id":1, "nome":"1A"}, ...])
     * da instituição do usuário logado.
     */
    @GetMapping
    public ResponseEntity<List<Turma>> getTurmas(Authentication authentication) {
        Professor professorLogado = getProfessorLogado(authentication);
        List<Turma> turmas = turmaRepository.findByInstituicao(
            professorLogado.getInstituicao()
        );
        return ResponseEntity.ok(turmas);
    }
    
    /**
     * Cria uma nova turma (ex: {"nome":"3C"})
     */
    @PostMapping
    public ResponseEntity<?> criarTurma(@RequestBody Map<String, String> payload, Authentication authentication) {
        Professor professorLogado = getProfessorLogado(authentication);
        String nomeTurma = payload.get("nome");

        if (nomeTurma == null || nomeTurma.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("O nome da turma não pode ser vazio.");
        }
        
        // Verifica se a turma já existe
        if (turmaRepository.existsByNomeAndInstituicao(nomeTurma, professorLogado.getInstituicao())) {
            return ResponseEntity.badRequest().body("Uma turma com este nome já existe.");
        }
        
        // Cria e salva a nova turma
        Turma novaTurma = new Turma(nomeTurma, professorLogado.getInstituicao());
        turmaRepository.save(novaTurma);
        
        return ResponseEntity.ok(novaTurma);
    }
    
    private Professor getProfessorLogado(Authentication authentication) {
        String username = authentication.getName();
        return professorRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Professor não encontrado: " + username));
    }
}