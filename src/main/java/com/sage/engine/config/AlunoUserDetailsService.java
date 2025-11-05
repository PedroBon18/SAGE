package com.sage.engine.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.sage.engine.model.Aluno;
import com.sage.engine.repository.AlunoRepository;

@Service
public class AlunoUserDetailsService implements UserDetailsService {

    @Autowired
    private AlunoRepository alunoRepository; 

    @Autowired
    private PasswordEncoder passwordEncoder; 

    @Override
    public UserDetails loadUserByUsername(String matricula) throws UsernameNotFoundException {
        // Encontra o Aluno pela Matrícula
        Aluno aluno = alunoRepository.findByMatricula(matricula)
            .orElseThrow(() -> new UsernameNotFoundException("Aluno não encontrado: " + matricula));
        
        // Simulação de Senha: Para um teste simples, usaremos a matrícula como senha ENCRIPTADA.
        // O LoginController usará este UserDetails para criar o token.
        // Já que a validação de senha é feita manualmente no LoginController para este cenário,
        // aqui apenas garantimos que o Spring Security pode construir o UserDetails.
        
        // Usamos a senha encriptada da matrícula para o Spring Security conseguir validar,
        // mas a validação real (comparação) tem que ser tratada no LoginController,
        // pois a senha real (a matrícula em texto simples) não está no DB.
        
        // IMPORTANTE: Se o seu Aluno.java tiver um campo 'password', você usaria:
        // String senhaEncriptada = aluno.getPassword();

        // Como o AlunoUsuario.java (entidade de login) usa a matricula, vamos usar a matricula encriptada:
        String senhaEncriptadaDaMatricula = passwordEncoder.encode(matricula); 
        
        // Retorna o objeto UserDetails para o Spring Security
        return User.builder()
            .username(aluno.getMatricula())
            .password(senhaEncriptadaDaMatricula) 
            .roles("ALUNO") 
            .build();
    }
}