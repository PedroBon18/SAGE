package com.sage.engine.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.dto.LoginRequest;
import com.sage.engine.model.Professor;
import com.sage.engine.repository.ProfessorRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class LoginController {

    @Autowired
    private ProfessorRepository professorRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private SecurityContextRepository securityContextRepository;

    @PostMapping("/api/login")
    public ResponseEntity<String> manualLogin(
            @RequestBody LoginRequest loginRequest, 
            HttpServletRequest request, 
            HttpServletResponse response) {

        // 1. Encontra o professor pelo username
        Professor prof = professorRepository.findByUsername(loginRequest.getUsername()).orElse(null);

        // 2. Verifica se o professor existe
        if (prof == null) {
            return ResponseEntity.status(401).body("Credenciais inválidas (Usuário)");
        }

        // 3. Verifica a Senha
        if (!passwordEncoder.matches(loginRequest.getPassword(), prof.getPassword())) {
            return ResponseEntity.status(401).body("Credenciais inválidas (Senha)");
        }

        // 4. VERIFICAÇÕES EXTRA (Instituição, Cargo, Matéria)
        if (!prof.getInstituicao().equalsIgnoreCase(loginRequest.getInstituicao())) {
            return ResponseEntity.status(401).body("Credenciais inválidas (Instituição)");
        }
        
        if (!prof.getCargo().equalsIgnoreCase(loginRequest.getCargo())) {
            return ResponseEntity.status(401).body("Credenciais inválidas (Cargo)");
        }

        // 5. Se for PROFESSOR, verifica a matéria. Se for COORDENADOR, ignora.
        if (prof.getCargo().equalsIgnoreCase("PROFESSOR")) {
            if (prof.getMateria() == null || loginRequest.getMateria() == null || 
                !prof.getMateria().equalsIgnoreCase(loginRequest.getMateria())) {
                return ResponseEntity.status(401).body("Credenciais inválidas (Matéria)");
            }
        }

        // --- SUCESSO! O usuário passou em todas as 5 verificações ---

        // 6. Cria a sessão de segurança manualmente
        UserDetails userDetails = User.builder()
                .username(prof.getUsername())
                .password(prof.getPassword()) // Usa a senha encriptada, não faz mal
                .roles(prof.getCargo().toUpperCase())
                .build();
        
        UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.authenticated(
            userDetails, null, userDetails.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(token);
        
        // Salva o contexto, criando a sessão (cookie)
        securityContextRepository.saveContext(context, request, response);

        return ResponseEntity.ok("Login bem-sucedido");
    }
}