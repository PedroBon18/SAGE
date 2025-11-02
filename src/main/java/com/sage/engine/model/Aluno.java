package com.sage.engine.model; 

import java.util.List;
import java.util.Map;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.MapKeyColumn;

@Entity
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String matricula;

    private String nome;
    private double media;
    private String anotacao;
    private String metas;
    private String feedback;
    private String alerta;
    private String classeFoto;

    @Lob 
    @Column(columnDefinition = "TEXT") 
    private String fotoBase64;
    
    @ElementCollection
    @CollectionTable(name = "aluno_notas")
    @MapKeyColumn(name = "materia")
    @Column(name = "nota")
    private Map<String, Double> notas;

    @ElementCollection
    @CollectionTable(name = "aluno_historico_media")
    @Column(name = "media_trimestre")
    private List<Double> historicoMedia;

    @ElementCollection
    @CollectionTable(name = "aluno_faltas_materia")
    @MapKeyColumn(name = "materia")
    @Column(name = "faltas")
    private Map<String, Integer> faltasPorMateria;

    @ElementCollection
    @CollectionTable(name = "aluno_aulas_materia")
    @MapKeyColumn(name = "materia")
    @Column(name = "aulas_totais")
    private Map<String, Integer> aulasTotaisPorMateria;

    @Column(nullable = false)
    private String instituicao;

    // --- CAMPO DE TURMA ATUALIZADO ---
    // Guardamos apenas o NOME da turma.
    @Column(nullable = false)
    private String turma; // Ex: "1A", "1B", "2A"
    // ---------------------------

    public Aluno() {}

    // --- Getters e Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMatricula() { return matricula; }
    public void setMatricula(String matricula) { this.matricula = matricula; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public double getMedia() { return media; }
    public void setMedia(double media) { this.media = media; }
    public String getAnotacao() { return anotacao; }
    public void setAnotacao(String anotacao) { this.anotacao = anotacao; }
    public String getMetas() { return metas; }
    public void setMetas(String metas) { this.metas = metas; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getAlerta() { return alerta; }
    public void setAlerta(String alerta) { this.alerta = alerta; }
    public String getClasseFoto() { return classeFoto; }
    public void setClasseFoto(String classeFoto) { this.classeFoto = classeFoto; }
    
    public Map<String, Double> getNotas() { return notas; }
    public void setNotas(Map<String, Double> notas) { this.notas = notas; }
    public List<Double> getHistoricoMedia() { return historicoMedia; }
    public void setHistoricoMedia(List<Double> historicoMedia) { this.historicoMedia = historicoMedia; }
    public String getFotoBase64() { return fotoBase64; }
    public void setFotoBase64(String fotoBase64) { this.fotoBase64 = fotoBase64; }

    public Map<String, Integer> getFaltasPorMateria() { return faltasPorMateria; }
    public void setFaltasPorMateria(Map<String, Integer> faltasPorMateria) { this.faltasPorMateria = faltasPorMateria; }
    public Map<String, Integer> getAulasTotaisPorMateria() { return aulasTotaisPorMateria; }
    public void setAulasTotaisPorMateria(Map<String, Integer> aulasTotaisPorMateria) { this.aulasTotaisPorMateria = aulasTotaisPorMateria; }

    public String getInstituicao() { return instituicao; }
    public void setInstituicao(String instituicao) { this.instituicao = instituicao; }
    
    // --- GETTER E SETTER DA TURMA ---
    public String getTurma() { return turma; }
    public void setTurma(String turma) { this.turma = turma; }
}