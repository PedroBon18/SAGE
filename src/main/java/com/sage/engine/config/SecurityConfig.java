package com.sage.engine.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository; 

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Define o codificador de senhas (PasswordEncoder).
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * BEAN CORRIGIDO: Define como o Spring Security deve armazenar o SecurityContext.
     * Este Bean será usado automaticamente pelo HttpSecurity.
     */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        // Usa o repositório baseado na sessão HTTP (padrão do Spring)
        return new HttpSessionSecurityContextRepository();
    }

    /**
     * Define a cadeia de filtros de segurança (SecurityFilterChain)
     * * --- CORREÇÃO APLICADA AQUI ---
     * 1. Removemos SecurityContextRepository dos parâmetros do método.
     * 2. Removemos o bloco .securityContext(...) da configuração.
     * O Spring irá automaticamente usar o Bean 'securityContextRepository' definido acima.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
            // O SecurityContextRepository foi removido dos parâmetros
    ) throws Exception {

        http
            // 1. O bloco .securityContext() foi removido.
            // O Spring usará o Bean 'securityContextRepository' por predefinição.

            // 2. Regras de Autorização
            .authorizeHttpRequests(auth -> auth
                // Acesso irrestrito a ficheiros estáticos, login e logout
                .requestMatchers(
                    // Páginas e recursos públicos
                    "/login.html", "/login.js", "/login.css", 
                    "/api/login", "/logout", 
                    
                    // Recursos estáticos
                    "/img/**", "/favicon/**", "/static/**",
                    "/*.ico", "/*.png", "/*.jpg", "/*.gif",
                    
                    // Página de erro
                    "/error"
                ).permitAll()
                
                // NOVO: Permite que o ALUNO aceda apenas ao seu próprio perfil
                .requestMatchers(HttpMethod.GET, "/api/alunos/me").hasRole("ALUNO") 
                
                // Regras para Professor/Coordenador (Listar, Criar, Editar, Apagar)
                .requestMatchers(HttpMethod.GET, "/api/alunos").hasAnyRole("PROFESSOR", "COORDENADOR") // Listar (GET sem /me)
                .requestMatchers(HttpMethod.POST, "/api/alunos").hasAnyRole("PROFESSOR", "COORDENADOR")
                .requestMatchers(HttpMethod.PUT, "/api/alunos/**").hasAnyRole("PROFESSOR", "COORDENADOR")
                .requestMatchers(HttpMethod.DELETE, "/api/alunos/**").hasAnyRole("PROFESSOR", "COORDENADOR")
                
                // Rotas de Turmas e Info de Usuário (acessíveis se autenticado, mas restritas por papel no Controller)
                .requestMatchers(HttpMethod.GET, "/api/turmas", "/api/usuario/info").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/turmas").hasRole("COORDENADOR")
                .requestMatchers(HttpMethod.DELETE, "/api/turmas/**").hasRole("COORDENADOR")
                
                // Rotas de páginas estáticas e root (acessíveis se autenticado)
                .requestMatchers(
                    "/index.html", "/main.js", "/style.css", "/turmas.html", "/turmas.js",
                    "/"
                ).authenticated()

                // Exige autenticação para qualquer outra requisição não listada
                .anyRequest().authenticated()
            )
            
            // 3. Configurações de Sessão e Logout
            .csrf(csrf -> csrf.disable()) // Desabilita CSRF
            .formLogin(form -> form.disable()) // Desabilita formLogin padrão
            .httpBasic(httpBasic -> httpBasic.disable()) // Desabilita Basic auth
            .sessionManagement(session -> session
                // Não cria sessão se não houver (para APIs stateless)
                .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.IF_REQUIRED) 
                // Permite apenas uma sessão por utilizador
                .maximumSessions(1).maxSessionsPreventsLogin(true)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login.html")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            );

        return http.build();
    }
}