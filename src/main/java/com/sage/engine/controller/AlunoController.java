package com.sage.engine.controller; 

import java.util.List; 

import org.springframework.beans.factory.annotation.Autowired; 
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException; 
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    private ProfessorRepository professorRepository; // NECESSÁRIO PARA SABER A INSTITUIÇÃO

    /**
     * Retorna apenas os alunos da instituição do professor logado.
     */
    @GetMapping
    public List<Aluno> listarTodosAlunos(Authentication authentication) {
        Professor professorLogado = getProfessorLogado(authentication);
        // Filtra os alunos pela instituição do professor
        return alunoRepository.findAllByInstituicao(professorLogado.getInstituicao());
    }
    
    /**
     * Cria um novo aluno, definindo automaticamente a instituição.
     */
    @PostMapping
    public Aluno criarNovoAluno(@RequestBody Aluno novoAluno, Authentication authentication) {
        Professor professorLogado = getProfessorLogado(authentication);
        
        // Define a instituição do novo aluno como a mesma do professor que o está criando
        novoAluno.setInstituicao(professorLogado.getInstituicao());

        if (novoAluno.getFaltasPorMateria() == null) {
            novoAluno.setFaltasPorMateria(new java.util.HashMap<>());
        }
        if (novoAluno.getAulasTotaisPorMateria() == null) {
            novoAluno.setAulasTotaisPorMateria(new java.util.HashMap<>());
        }
        return alunoRepository.save(novoAluno);
    }

    /**
     * Atualiza um aluno (garante que o professor só edite alunos da sua instituição).
     */
    @PutMapping("/{id}")
    public ResponseEntity<Aluno> atualizarAluno(@PathVariable Long id, @RequestBody Aluno alunoAtualizado, Authentication authentication) {
        
        Professor professorLogado = getProfessorLogado(authentication);
        String instituicaoProfessor = professorLogado.getInstituicao();

        return alunoRepository.findById(id)
                .map(alunoExistente -> {
                    
                    // Verificação de segurança: O professor pode editar este aluno?
                    if (!alunoExistente.getInstituicao().equals(instituicaoProfessor)) {
                        // Se o aluno for de outra escola, retorna "Não autorizado"
                        
                        // --- CORREÇÃO AQUI (no .build()) ---
                        return ResponseEntity.status(403).<Aluno>build(); 
                    }

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
                    // A instituição do aluno não muda

                    Aluno salvo = alunoRepository.save(alunoExistente);
                    return ResponseEntity.ok(salvo);
                })
                // --- CORREÇÃO AQUI (no .build()) ---
                .orElse(ResponseEntity.notFound().<Aluno>build());
    }
    
    /**
     * Método utilitário para buscar o Professor logado a partir da autenticação.
     */
    private Professor getProfessorLogado(Authentication authentication) {
        String username = authentication.getName();
        return professorRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Professor não encontrado: " + username));
    }
}