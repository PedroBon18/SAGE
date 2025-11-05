package com.sage.engine.controller; 

import java.util.List; 
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired; 
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam; 
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.model.Aluno;
import com.sage.engine.model.Professor; 
import com.sage.engine.repository.AlunoRepository;
import com.sage.engine.repository.ProfessorRepository; 

@RestController
@RequestMapping("/api/alunos")
// @CrossOrigin(origins = "*", allowCredentials = "true") // <-- ESTA LINHA FOI REMOVIDA
public class AlunoController {

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Retorna os alunos da instituição E TURMA especificadas (para Professor/Coordenador).
     * Ex: GET /api/alunos?turma=1A
     */
    @GetMapping
    public List<Aluno> listarTodosAlunos(
            @RequestParam String turma, 
            Authentication authentication) {
        
        Professor professorLogado = getProfessorLogado(authentication);
        
        // Filtra pela instituição (segurança) E pela turma (filtro do usuário)
        return alunoRepository.findAllByInstituicaoAndTurma(
            professorLogado.getInstituicao(), 
            turma
        );
    }
    
    /**
     * NOVO ENDPOINT: Retorna apenas o aluno logado (para uso pelo próprio aluno).
     * Ex: GET /api/alunos/me
     * O Spring Security garante que apenas usuários com a role 'ALUNO' acessam.
     */
    @GetMapping("/me")
    public ResponseEntity<Aluno> getAlunoLogado(Authentication authentication) {
        // O nome de autenticação para um aluno é a sua Matrícula (ver AlunoUserDetailsService)
        String matricula = authentication.getName();
        
        return alunoRepository.findByMatricula(matricula)
                .map(ResponseEntity::ok)
                // Se for encontrado, retorna 200 OK com o objeto Aluno.
                .orElse(ResponseEntity.notFound().build()); 
    }
    
    /**
     * Cria um novo aluno. Acesso restrito a Professor/Coordenador.
     * * --- CORREÇÃO APLICADA (Turno anterior) ---
     */
    @PostMapping
    public Aluno criarNovoAluno(@RequestBody Aluno aluno, Authentication authentication) {
        // 1. Obtém o professor logado
        Professor professorLogado = getProfessorLogado(authentication);
        
        // 2. Define a instituição (obrigatório e por segurança)
        aluno.setInstituicao(professorLogado.getInstituicao());
        
        // 3. Define uma palavra-passe padrão (ex: a matrícula) e codifica-a
        if (aluno.getMatricula() != null && !aluno.getMatricula().isEmpty()) {
            aluno.setPassword(passwordEncoder.encode(aluno.getMatricula()));
        } else {
            // Fallback caso a matrícula venha vazia
            String matriculaPadrao = "MAT-" + System.currentTimeMillis();
            aluno.setMatricula(matriculaPadrao);
            aluno.setPassword(passwordEncoder.encode(matriculaPadrao));
        }
        
        // 4. Salva o aluno agora completo
        return alunoRepository.save(aluno);
    }

    /**
     * Atualiza um aluno existente. Acesso restrito a Professor/Coordenador.
     * * --- CORREÇÃO APLICADA (Turno anterior) ---
     */
    @PutMapping("/{id}")
    public ResponseEntity<Aluno> atualizarAluno(
            @PathVariable Long id, 
            @RequestBody Aluno alunoAtualizado) {
        
        return alunoRepository.findById(id)
                .map(alunoExistente -> {
                    
                    // --- ATUALIZAÇÃO SEGURA ---
                    alunoExistente.setNome(alunoAtualizado.getNome());
                    alunoExistente.setMatricula(alunoAtualizado.getMatricula()); 
                    alunoExistente.setMedia(alunoAtualizado.getMedia());
                    alunoExistente.setAnotacao(alunoAtualizado.getAnotacao());
                    alunoExistente.setMetas(alunoAtualizado.getMetas());
                    alunoExistente.setFeedback(alunoAtualizado.getFeedback());
                    alunoExistente.setAlerta(alunoAtualizado.getAlerta());
                    alunoExistente.setClasseFoto(alunoAtualizado.getClasseFoto());
                    alunoExistente.setFotoBase64(alunoAtualizado.getFotoBase64());
                    alunoExistente.setNotas(alunoAtualizado.getNotas());
                    alunoExistente.setHistoricoMedia(alunoAtualizado.getHistoricoMedia());
                    alunoExistente.setFaltasPorMateria(alunoAtualizado.getFaltasPorMateria());
                    alunoExistente.setAulasTotaisPorMateria(alunoAtualizado.getAulasTotaisPorMateria());
                    alunoExistente.setTurma(alunoAtualizado.getTurma());
                    
                    return ResponseEntity.ok(alunoRepository.save(alunoExistente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint temporário para atualizar turma e senha do aluno.
     * * --- CORREÇÃO APLICADA (Turno anterior) ---
     */
    @PostMapping("/setup-test")
    public ResponseEntity<String> setupTestAluno() {
        try {
            Optional<Aluno> alunoOpt = alunoRepository.findByMatricula("joao.test");
            
            if (alunoOpt.isPresent()) {
                Aluno joao = alunoOpt.get();
                joao.setTurma("1A");
                joao.setPassword(passwordEncoder.encode("senha123")); // Correto
                
                alunoRepository.save(joao);
                return ResponseEntity.ok("Aluno atualizado com sucesso!");
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao atualizar aluno: " + e.getMessage());
        }
    }

    /**
     * Apaga um aluno. Acesso restrito a Professor/Coordenador.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagarAluno(@PathVariable Long id) {
        if (alunoRepository.existsById(id)) {
            alunoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Método auxiliar para obter o professor logado
     */
    private Professor getProfessorLogado(Authentication authentication) {
        String username = authentication.getName();
        Optional<Professor> professorOpt = professorRepository.findByUsername(username);
        
        if (professorOpt.isEmpty()) {
            throw new UsernameNotFoundException("Professor não encontrado: " + username);
        }
        
        return professorOpt.get();
    }
}