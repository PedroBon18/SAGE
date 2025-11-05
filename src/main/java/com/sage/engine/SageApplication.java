package com.sage.engine;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.sage.engine.model.Professor;
import com.sage.engine.model.Turma;
import com.sage.engine.model.Aluno; // NOVO: Importar Aluno
import com.sage.engine.repository.ProfessorRepository;
import com.sage.engine.repository.TurmaRepository; 
import com.sage.engine.repository.AlunoRepository; // NOVO: Importar AlunoRepository

import java.util.HashMap;

@SpringBootApplication
public class SageApplication {

	public static void main(String[] args) {
		SpringApplication.run(SageApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(
			ProfessorRepository professorRepository, 
			TurmaRepository turmaRepository,
			AlunoRepository alunoRepository, // NOVO: Injetar AlunoRepository
			PasswordEncoder passwordEncoder
	) {
		return args -> {
			String senhaEncriptada = passwordEncoder.encode("senha123");
			
			// --- UTILIZADORES DA ESCOLA A ---
			Professor profMat = new Professor("prof_mat", senhaEncriptada, "Prof. Matematico", "PROFESSOR", "Escola A", "Matemática");
			Professor coordA = new Professor("coord_a", senhaEncriptada, "Coord. Ana", "COORDENADOR", "Escola A", null);

            // --- UTILIZADOR DA ESCOLA B ---
			Professor profB = new Professor("prof_b", senhaEncriptada, "Prof. Beto", "PROFESSOR", "Escola B", "Português");

			if (professorRepository.findByUsername("prof_mat").isEmpty()) professorRepository.save(profMat);
			if (professorRepository.findByUsername("coord_a").isEmpty()) professorRepository.save(coordA);
            if (professorRepository.findByUsername("prof_b").isEmpty()) professorRepository.save(profB);
			
            // --- ADICIONAR TURMAS DE TESTE ---
            if (!turmaRepository.existsByNomeAndInstituicao("1A", "Escola A")) {
                turmaRepository.save(new Turma("1A", "Escola A"));
            }
            if (!turmaRepository.existsByNomeAndInstituicao("1B", "Escola A")) {
                turmaRepository.save(new Turma("1B", "Escola A"));
            }
            if (!turmaRepository.existsByNomeAndInstituicao("1A", "Escola B")) {
                turmaRepository.save(new Turma("1A", "Escola B"));
            }
            
            // --- NOVO: ALUNO DE TESTE ---
            String matriculaTeste = "A001";
            if (alunoRepository.findByMatricula(matriculaTeste).isEmpty()) {
                Aluno alunoTeste = new Aluno();
                alunoTeste.setMatricula(matriculaTeste);
                alunoTeste.setNome("João Aluno Teste");
                alunoTeste.setInstituicao("Escola A");
                alunoTeste.setTurma("1A");
                alunoTeste.setMedia(7.5);
                alunoTeste.setPassword(senhaEncriptada);
                
                // Adicionar algumas notas e faltas para testes no frontend
                alunoTeste.setNotas(new HashMap<String, Double>() {{
                    put("Matemática", 8.0);
                    put("Português", 7.0);
                    put("História", 6.0);
                }});
                alunoTeste.setFaltasPorMateria(new HashMap<String, Integer>() {{
                    put("Matemática", 2);
                    put("Português", 0);
                }});
                alunoTeste.setHistoricoMedia(java.util.Arrays.asList(6.0, 7.0, 8.5));
                alunoTeste.setAnotacao("Aluno de teste para validação do sistema.");
                alunoTeste.setClasseFoto("DefaultProfile");
                
                alunoRepository.save(alunoTeste);
            }
            // --- FIM DO NOVO ALUNO ---

			System.out.println("--- Perfis e Turmas de teste criados ---");
		};
	}
}