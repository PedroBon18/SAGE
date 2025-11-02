package com.sage.engine;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.sage.engine.model.Professor;
import com.sage.engine.repository.ProfessorRepository;

@SpringBootApplication
public class SageApplication {

	public static void main(String[] args) {
		SpringApplication.run(SageApplication.class, args);
	}

	/**
	 * Construtor do Professor:
	 * (username, password, nomeCompleto, cargo, instituicao, materia)
	 */
	@Bean
	CommandLineRunner initDatabase(ProfessorRepository professorRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			String senhaEncriptada = passwordEncoder.encode("senha123");
			
			// --- UTILIZADORES DA ESCOLA A ---
			
			// 1. Professor de Matemática (Visão limitada)
			Professor profMat = new Professor(
				"prof_mat", 
				senhaEncriptada, 
				"Prof. Matematico", 
				"PROFESSOR",       // Cargo
				"Escola A",        // Instituição
				"Matemática"       // Matéria
			);
			
			// 2. Coordenador (Visão geral)
			Professor coordA = new Professor(
				"coord_a", 
				senhaEncriptada, 
				"Coord. Ana", 
				"COORDENADOR",     // Cargo
				"Escola A",        // Instituição
				null               // Sem matéria específica
			);

            // --- UTILIZADOR DA ESCOLA B (para testar o filtro) ---
			Professor profB = new Professor(
				"prof_b", 
				senhaEncriptada, 
				"Prof. Beto", 
				"PROFESSOR",       // Cargo
				"Escola B",        // Instituição
				"Português"        // Matéria
			);


			// Salva na base de dados (apenas se não existirem)
			if (professorRepository.findByUsername("prof_mat").isEmpty()) {
				professorRepository.save(profMat);
			}
			if (professorRepository.findByUsername("coord_a").isEmpty()) {
				professorRepository.save(coordA);
			}
            if (professorRepository.findByUsername("prof_b").isEmpty()) {
				professorRepository.save(profB);
			}
			
			System.out.println("--- Perfis de teste (Professor e Coordenador) criados ---");
		};
	}
}