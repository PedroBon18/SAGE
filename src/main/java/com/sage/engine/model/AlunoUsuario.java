package com.sage.engine.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

// Usaremos a tabela Aluno como base para o login
@Entity
@Table(name = "aluno")
public class AlunoUsuario {

    @Id
    private Long id; // ID do Aluno

    @Transient
    private String username; // Usaremos a matrícula como username para login

    @Transient
    private String password; // A senha não é armazenada na entidade Aluno, usaremos uma senha padrão

    private String matricula; // Para buscar o aluno

    // Getters e Setters necessários para o login
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMatricula() { return matricula; }
    public void setMatricula(String matricula) { this.matricula = matricula; }

    // Usaremos a matricula como username
    public String getUsername() { return this.matricula; }

    /**
     * Retorna a senha (null), pois o valor ENCODED é fornecido pelo AlunoUserDetailsService.
     * A validação da senha (matrícula em texto simples) é feita manualmente no LoginController.
     */
    public String getPassword() {
        return null; 
    }

    public String getCargo() { return "ALUNO"; }
}