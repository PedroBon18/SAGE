package com.sage.engine.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional; // <-- IMPORT ADICIONADO

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException; 
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.model.Aluno;
import com.sage.engine.model.Professor;
import com.sage.engine.repository.AlunoRepository;
import com.sage.engine.repository.ProfessorRepository;

@RestController
@RequestMapping("/api/usuario") // <-- Isto define a base do URL
@CrossOrigin(origins = "*")
public class ProfessorController {

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private AlunoRepository alunoRepository; // <-- 1. REPOSITÓRIO DO ALUNO ADICIONADO

    /**
     * Endpoint para o front-end descobrir o CARGO e a MATÉRIA do usuário logado.
     */
    @GetMapping("/info") // <-- Isto define o fim do URL. Total: /api/usuario/info
    public ResponseEntity<Map<String, String>> getInfoDoUsuario(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build(); 
        }

        String username = authentication.getName(); // Para o professor, é username; para o aluno, é matricula
        Map<String, String> userInfo = new HashMap<>();
        
        // --- 2. LÓGICA DE VERIFICAÇÃO MODIFICADA ---
        
        // 2.1. Tenta encontrar como Professor/Coordenador
        Optional<Professor> profOpt = professorRepository.findByUsername(username);
        if (profOpt.isPresent()) {
            Professor professor = profOpt.get();
            userInfo.put("cargo", professor.getCargo());
            userInfo.put("materia", professor.getMateria()); 
            return ResponseEntity.ok(userInfo);
        }

        // 2.2. Se não for professor, tenta encontrar como Aluno
        Optional<Aluno> alunoOpt = alunoRepository.findByMatricula(username);
        if (alunoOpt.isPresent()) {
            // Se for aluno, retorna o cargo "ALUNO"
            userInfo.put("cargo", "ALUNO");
            userInfo.put("materia", null); // Aluno não tem matéria principal
            return ResponseEntity.ok(userInfo);
        }

        // 2.3. Se não for nenhum dos dois, o usuário não existe
        throw new UsernameNotFoundException("Usuário não encontrado: " + username);
        // --- FIM DA MODIFICAÇÃO ---
    }
}