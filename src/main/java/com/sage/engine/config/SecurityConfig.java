package com.sage.engine.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; 
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository; 

import com.sage.engine.repository.ProfessorRepository;
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public UserDetailsService userDetailsService(ProfessorRepository professorRepository) {
        return username -> professorRepository.findByUsername(username)
            .map(professor -> User.builder()
                .username(professor.getUsername())
                .password(professor.getPassword())
                .roles(professor.getCargo().toUpperCase()) 
                .build())
            .orElseThrow(() -> new UsernameNotFoundException("Professor não encontrado: " + username));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http, 
            SecurityContextRepository securityContextRepository 
    ) throws Exception {
        
        http
            .authorizeHttpRequests(auth -> auth
                // 1. Permite o acesso público a ficheiros estáticos E ao LOGOUT
                .requestMatchers(
                    "/h2-console/**", 
                    "/api/login",
                    "/img/**",
                    "/error",        // Página de erro

                    // --- Ficheiros de Login ---
                    "/login.html",   
                    "/login.css",
                    "/login.js",
                    
                    // --- Ficheiros de Turmas/Dashboard ---
                    "/turmas.html",  
                    "/turmas.js",
                    "/index.html",   
                    "/main.js",      
                    "/style.css",
                    
                    "/logout" // Acesso permitido
                ).permitAll()
                
                // --- 2. REGRAS DE API ---
                .requestMatchers(HttpMethod.GET, "/api/turmas", "/api/usuario/info").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/turmas").hasRole("COORDENADOR")
                .requestMatchers(HttpMethod.DELETE, "/api/turmas/**").hasRole("COORDENADOR")
                
                // 3. Exige autenticação para o resto
                .anyRequest().authenticated() 
            )
            
            .formLogin(form -> form.disable()) 

            // --- CORREÇÃO DA SESSÃO DE LOGOUT ---
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login.html") 
                .invalidateHttpSession(true) // 1. Garante que a sessão é destruída
                .deleteCookies("JSESSIONID") // 2. Remove a cookie de sessão
            )
            // ------------------------------------
            
            .securityContext(context -> context
                .securityContextRepository(securityContextRepository)
            )
            
            .exceptionHandling(e -> e
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendRedirect("/login.html");
                })
            )
            
            .csrf(csrf -> csrf
                .ignoringRequestMatchers(
                    "/h2-console/**", 
                    "/api/login", 
                    "/api/alunos/**", 
                    "/api/turmas/**" 
                ) 
            )
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin())
            ); 

        return http.build();
    }
}