package com.sage.engine.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Professor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username; // Este será usado para o Login

    @Column(nullable = false)
    private String password; // Senha encriptada

    @Column(nullable = false)
    private String nomeCompleto; // "Nome"

    @Column(nullable = false)
    private String cargo; // "Cargo" (ex: "PROFESSOR", "COORDENADOR")

    @Column(nullable = false)
    private String instituicao; // "Instituição" (ex: "Escola A")
    
    private String materia; // "Matéria" (Opcional, só para PROFESSOR)

    // Construtor vazio
    public Professor() {}

    // Construtor para facilitar a criação
    public Professor(String username, String password, String nomeCompleto, String cargo, String instituicao, String materia) {
        this.username = username;
        this.password = password;
        this.nomeCompleto = nomeCompleto;
        this.cargo = cargo; // Cargo é obrigatório
        this.instituicao = instituicao; // Instituição é obrigatória
        this.materia = materia; // Matéria é opcional
    }

    // --- Getters e Setters ---
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getNomeCompleto() { return nomeCompleto; }
    public void setNomeCompleto(String nomeCompleto) { this.nomeCompleto = nomeCompleto; }
    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public String getInstituicao() { return instituicao; }
    public void setInstituicao(String instituicao) { this.instituicao = instituicao; }
    public String getMateria() { return materia; }
    public void setMateria(String materia) { this.materia = materia; }
}