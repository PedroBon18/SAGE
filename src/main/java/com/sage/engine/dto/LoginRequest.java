package com.sage.engine.dto;

// Esta classe não precisa de anotações do Spring,
// é apenas para guardar os dados do JSON.
public class LoginRequest {
    private String username;
    private String password;
    private String instituicao;
    private String cargo;
    private String materia;
    private String matricula;

    // Getters
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getInstituicao() { return instituicao; }
    public String getCargo() { return cargo; }
    public String getMateria() { return materia; }
    public String getMatricula() { return matricula; }
    
    // Setters (Necessários para o Jackson mapear o JSON)
    public void setUsername(String u) { this.username = u; }
    public void setPassword(String p) { this.password = p; }
    public void setInstituicao(String i) { this.instituicao = i; }
    public void setCargo(String c) { this.cargo = c; }
    public void setMateria(String m) { this.materia = m; }
    public void setMatricula(String m) { this.matricula = m; }
}