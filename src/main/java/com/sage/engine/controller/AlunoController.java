package com.sage.engine.controller; // PACOTE CORRIGIDO

import java.util.List; // IMPORT CORRIGIDO

import org.springframework.beans.factory.annotation.Autowired; // IMPORT CORRIGIDO
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sage.engine.model.Aluno;
import com.sage.engine.repository.AlunoRepository;

@RestController
@RequestMapping("/api/alunos")
@CrossOrigin(origins = "*") 
public class AlunoController {

    @Autowired
    private AlunoRepository alunoRepository;

    @GetMapping
    public List<Aluno> listarTodosAlunos() {
        return alunoRepository.findAll();
    }
    
    @PostMapping
    public Aluno criarNovoAluno(@RequestBody Aluno novoAluno) {
        return alunoRepository.save(novoAluno);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Aluno> atualizarAluno(@PathVariable Long id, @RequestBody Aluno alunoAtualizado) {
        
        return alunoRepository.findById(id)
                .map(alunoExistente -> {
                    alunoExistente.setNome(alunoAtualizado.getNome());
                    alunoExistente.setMatricula(alunoAtualizado.getMatricula());
                    alunoExistente.setMedia(alunoAtualizado.getMedia());
                    alunoExistente.setAnotacao(alunoAtualizado.getAnotacao());
                    alunoExistente.setMetas(alunoAtualizado.getMetas());
                    alunoExistente.setFeedback(alunoAtualizado.getFeedback());
                    alunoExistente.setAlerta(alunoAtualizado.getAlerta());
                    alunoExistente.setFrequencia(alunoAtualizado.getFrequencia());
                    alunoExistente.setNotas(alunoAtualizado.getNotas());
                    alunoExistente.setHistoricoMedia(alunoAtualizado.getHistoricoMedia());
                    alunoExistente.setClasseFoto(alunoAtualizado.getClasseFoto());
                    alunoExistente.setFotoBase64(alunoAtualizado.getFotoBase64());

                    Aluno salvo = alunoRepository.save(alunoExistente);
                    return ResponseEntity.ok(salvo);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}