package com.sage.engine.controller; 

import java.util.List; 

import org.springframework.beans.factory.annotation.Autowired; 
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException; 
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping; // Import necessário
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
@CrossOrigin(origins = "*") 
public class AlunoController {

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    /**
     * Retorna os alunos da instituição E TURMA especificadas.
     * Ex: GET /api/alunos?turma=1A
     */
    @GetMapping
    public List<Aluno> listarTodosAlunos(
            @RequestParam String turma, // Exige o parâmetro "turma" (o nome da turma)
            Authentication authentication) {
        
        Professor professorLogado = getProfessorLogado(authentication);
        
        // Filtra pela instituição (segurança) E pela turma (filtro do usuário)
        return alunoRepository.findAllByInstituicaoAndTurma(
            professorLogado.getInstituicao(), 
            turma
        );
    }
    
    /**
     * Cria um novo aluno.
     * A instituição é definida pelo professor.
     * A turma (string) deve vir no objeto JSON.
     */
    @PostMapping
    public Aluno criarNovoAluno(@RequestBody Aluno novoAluno, Authentication authentication) {
        Professor professorLogado = getProfessorLogado(authentication);
        
        novoAluno.setInstituicao(professorLogado.getInstituicao());

        if (novoAluno.getTurma() == null || novoAluno.getTurma().isEmpty()) {
            throw new IllegalArgumentException("A turma é obrigatória para criar um novo aluno.");
        }

        if (novoAluno.getFaltasPorMateria() == null) {
            novoAluno.setFaltasPorMateria(new java.util.HashMap<>());
        }
        if (novoAluno.getAulasTotaisPorMateria() == null) {
            novoAluno.setAulasTotaisPorMateria(new java.util.HashMap<>());
        }
        return alunoRepository.save(novoAluno);
    }

    /**
     * Atualiza um aluno.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Aluno> atualizarAluno(@PathVariable Long id, @RequestBody Aluno alunoAtualizado, Authentication authentication) {
        
        Professor professorLogado = getProfessorLogado(authentication);
        String instituicaoProfessor = professorLogado.getInstituicao();

        return alunoRepository.findById(id)
                .map(alunoExistente -> {
                    
                    if (!alunoExistente.getInstituicao().equals(instituicaoProfessor)) {
                        return ResponseEntity.status(403).<Aluno>build(); 
                    }
                    
                    // Atualiza todos os campos
                    alunoExistente.setNome(alunoAtualizado.getNome());
                    alunoExistente.setMatricula(alunoAtualizado.getMatricula());
                    alunoExistente.setMedia(alunoAtualizado.getMedia());
                    alunoExistente.setAnotacao(alunoAtualizado.getAnotacao());
                    alunoExistente.setMetas(alunoAtualizado.getMetas());
                    alunoExistente.setFeedback(alunoAtualizado.getFeedback());
                    alunoExistente.setAlerta(alunoAtualizado.getAlerta());
                    alunoExistente.setNotas(alunoAtualizado.getNotas());
                    alunoExistente.setHistoricoMedia(alunoAtualizado.getHistoricoMedia());
                    alunoExistente.setClasseFoto(alunoAtualizado.getClasseFoto());
                    alunoExistente.setFotoBase64(alunoAtualizado.getFotoBase64());
                    alunoExistente.setFaltasPorMateria(alunoAtualizado.getFaltasPorMateria());
                    alunoExistente.setAulasTotaisPorMateria(alunoAtualizado.getAulasTotaisPorMateria());
                    alunoExistente.setTurma(alunoAtualizado.getTurma()); // Atualiza a turma

                    Aluno salvo = alunoRepository.save(alunoExistente);
                    return ResponseEntity.ok(salvo);
                })
                .orElse(ResponseEntity.notFound().<Aluno>build());
    }
    
    /**
     * Apaga um aluno pelo ID, com verificação de instituição.
     * Ex: DELETE /api/alunos/123
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> apagarAluno(@PathVariable Long id, Authentication authentication) {
        
        Professor professorLogado = getProfessorLogado(authentication);
        String instituicaoProfessor = professorLogado.getInstituicao();

        return alunoRepository.findById(id)
                .map(alunoExistente -> {
                    
                    // SEGURANÇA: Verifica se o aluno pertence à instituição do professor
                    if (!alunoExistente.getInstituicao().equals(instituicaoProfessor)) {
                        // Resposta 403 (Proibido) se não pertencer
                        return ResponseEntity.status(403).<Void>build(); 
                    }
                    
                    alunoRepository.delete(alunoExistente);
                    // Resposta 200 (OK) sem corpo
                    return ResponseEntity.ok().<Void>build();
                })
                // Resposta 404 se o ID não for encontrado
                .orElse(ResponseEntity.notFound().build());
    }

    private Professor getProfessorLogado(Authentication authentication) {
        String username = authentication.getName();
        return professorRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Professor não encontrado: " + username));
    }
}