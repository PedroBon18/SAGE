package com.sage.engine.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.model.Professor; // IMPORTAR ISTO
import com.sage.engine.repository.ProfessorRepository;

@RestController
@RequestMapping("/api/usuario")
@CrossOrigin(origins = "*")
public class ProfessorController {

    @Autowired
    private ProfessorRepository professorRepository;

    /**
     * Endpoint para o front-end descobrir o CARGO e a MATÉRIA do usuário logado.
     */
    @GetMapping("/info") // URL MUDOU (era /materia)
    public ResponseEntity<Map<String, String>> getInfoDoUsuario(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build(); 
        }

        String username = authentication.getName();
        
        Professor professor = professorRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Professor não encontrado: " + username));

        // Retorna um JSON com o cargo e a matéria
        // Ex: { "cargo": "PROFESSOR", "materia": "Matemática" }
        // Ex: { "cargo": "COORDENADOR", "materia": null }
        Map<String, String> userInfo = new HashMap<>();
        userInfo.put("cargo", professor.getCargo());
        userInfo.put("materia", professor.getMateria()); 
        
        return ResponseEntity.ok(userInfo);
    }
}