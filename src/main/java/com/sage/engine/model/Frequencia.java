package com.sage.engine.model; // PACOTE CORRIGIDO

import jakarta.persistence.Embeddable;

@Embeddable
public class Frequencia {

    private int faltas;
    private int totalAulas;

    public Frequencia() {}

    // Getters e Setters
    public int getFaltas() { return faltas; }
    public void setFaltas(int faltas) { this.faltas = faltas; }
    public int getTotalAulas() { return totalAulas; }
    public void setTotalAulas(int totalAulas) { this.totalAulas = totalAulas; }
}