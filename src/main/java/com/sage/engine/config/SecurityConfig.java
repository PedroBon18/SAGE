package com.sage.engine.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
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
                // 1. Permite o acesso público
                .requestMatchers(
                    "/h2-console/**", 
                    "/login.html",
                    "/login.css",
                    "/login.js",
                    "/api/login",
                    // --- LINHAS NOVAS ADICIONADAS AQUI ---
                    "/img/**", // Permite todas as imagens
                    "/img/favicon/favicon.ico" // Garante o favicon
                    // ------------------------------------
                ).permitAll()
                // 2. Exige autenticação para o resto
                .anyRequest().authenticated() 
            )
            
            .formLogin(form -> form.disable()) 

            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login.html")
            )
            
            .securityContext(context -> context
                .securityContextRepository(securityContextRepository)
            )

            .exceptionHandling(e -> e
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            )
            
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/h2-console/**", "/api/login", "/api/alunos/**") 
            )
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.sameOrigin())
            ); 

        return http.build();
    }
}