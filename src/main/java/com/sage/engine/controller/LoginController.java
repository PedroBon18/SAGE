package com.sage.engine.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.dto.LoginRequest;
import com.sage.engine.model.Aluno;
import com.sage.engine.model.Professor; 
import com.sage.engine.repository.AlunoRepository;
import com.sage.engine.repository.ProfessorRepository; 

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class LoginController {

    @Autowired
    private ProfessorRepository professorRepository;
    @Autowired
    private AlunoRepository alunoRepository; 
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private SecurityContextRepository securityContextRepository;

    // Assumimos que existe um UserDetailsService (pode ser o AlunoUserDetailsService ou um combinado)
    @Autowired
    private UserDetailsService alunoUserDetailsService; // Usaremos para simular a autenticação do aluno

    @PostMapping("/api/login")
    public ResponseEntity<String> manualLogin(
            @RequestBody LoginRequest loginRequest, 
            HttpServletRequest request, 
            HttpServletResponse response) {

        String cargo = loginRequest.getCargo().toUpperCase();
        UserDetails userDetails;

        if (cargo.equals("PROFESSOR") || cargo.equals("COORDENADOR")) {
            // --- 1. Lógica de Autenticação para PROFESSOR/COORDENADOR ---
            // (Omissa para brevidade, já a tem)
            Professor prof = professorRepository.findByUsername(loginRequest.getUsername()).orElse(null);

            if (prof == null || 
                !prof.getInstituicao().equalsIgnoreCase(loginRequest.getInstituicao()) ||
                !prof.getCargo().equalsIgnoreCase(loginRequest.getCargo())) {
                return ResponseEntity.status(401).body("Credenciais inválidas (Usuário/Cargo/Instituição)");
            }
            
            if (!passwordEncoder.matches(loginRequest.getPassword(), prof.getPassword())) {
                return ResponseEntity.status(401).body("Credenciais inválidas (Senha)");
            }

            if (prof.getCargo().equalsIgnoreCase("PROFESSOR")) {
                if (prof.getMateria() == null || loginRequest.getMateria() == null || 
                    !prof.getMateria().equalsIgnoreCase(loginRequest.getMateria())) {
                    return ResponseEntity.status(401).body("Credenciais inválidas (Matéria)");
                }
            }
            
            userDetails = User.builder()
                .username(prof.getUsername())
                .password(prof.getPassword()) 
                .roles(prof.getCargo().toUpperCase())
                .build();
                
        } else if (cargo.equals("ALUNO")) {
            // --- 2. Lógica de Autenticação para ALUNO ---
            
            // Usa o campo matricula específico para alunos
            String matricula = loginRequest.getMatricula();
            if (matricula == null || matricula.trim().isEmpty()) {
                return ResponseEntity.status(401).body("Matrícula é obrigatória para alunos");
            }
            
            // 2.1. Encontra o aluno pela matrícula
            Aluno aluno = alunoRepository.findByMatricula(matricula).orElse(null);

            if (aluno == null) {
                return ResponseEntity.status(401).body("Credenciais inválidas (Matrícula)");
            }
            
            // 2.2. Verifica a Instituição
            if (!aluno.getInstituicao().equalsIgnoreCase(loginRequest.getInstituicao())) {
                return ResponseEntity.status(401).body("Credenciais inválidas (Instituição)");
            }
            
            try {
                // Carrega os detalhes do aluno (que codifica a matrícula como senha)
                userDetails = alunoUserDetailsService.loadUserByUsername(matricula);
                
                // Validação de Senha (a senha é a própria matrícula)
                if (!loginRequest.getPassword().equals(matricula)) {
                    return ResponseEntity.status(401).body("Credenciais inválidas (Senha)");
                }

            } catch (UsernameNotFoundException e) {
                return ResponseEntity.status(401).body("Credenciais inválidas (Usuário)");
            }
            
        } else {
            return ResponseEntity.status(401).body("Cargo inválido.");
        }

        // --- SUCESSO! ---

        // 3. Cria a sessão de segurança manualmente
        UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.authenticated(
            userDetails, null, userDetails.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(token);
        
        // Salva o contexto, criando a sessão (cookie)
        securityContextRepository.saveContext(context, request, response);

        return ResponseEntity.ok("Login bem-sucedido");
    }
}