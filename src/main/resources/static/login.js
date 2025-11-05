// --- LÓGICA PARA EXIBIR/OCULTAR CAMPOS CONDICIONAIS ---
document.addEventListener('DOMContentLoaded', () => {
    const cargoSelect = document.getElementById('cargo');
    const materiaContainer = document.getElementById('materia-container');
    const materiaSelect = document.getElementById('materia');
    const matriculaContainer = document.getElementById('matricula-container');
    const matriculaInput = document.getElementById('matricula');

    function toggleConditionalFields() {
        // Controla o campo de matéria (apenas para professor)
        if (cargoSelect.value === 'professor') { 
            materiaContainer.style.display = 'block';
            materiaSelect.setAttribute('required', 'required');
        } else {
            materiaContainer.style.display = 'none';
            materiaSelect.removeAttribute('required');
            materiaSelect.value = "";
        }

        // Controla o campo de matrícula (apenas para aluno)
        if (cargoSelect.value === 'aluno') {
            matriculaContainer.style.display = 'block';
            matriculaInput.setAttribute('required', 'required');
        } else {
            matriculaContainer.style.display = 'none';
            matriculaInput.removeAttribute('required');
            matriculaInput.value = "";
        }
    }

    // Ouve as mudanças no seletor de Cargo
    cargoSelect.addEventListener('change', toggleConditionalFields);
    toggleConditionalFields(); // Configura o estado inicial
});
// --- FIM DA LÓGICA DE EXIBIR/OCULTAR ---


document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const form = event.target;
    const formData = new FormData(form);
    
    const loginData = {};
    formData.forEach((value, key) => {
        if (key === 'materia' && value === '') {
            loginData[key] = null;
        } else if (key === 'username' || key === 'instituicao' || key === 'cargo') {
             loginData[key] = value.trim(); 
        } else {
            loginData[key] = value;
        }
    });

    const messageContainer = document.getElementById('message-container');
    messageContainer.innerHTML = ''; 
    
    // NOVO: Captura o cargo para o redirecionamento
    const cargo = loginData.cargo ? loginData.cargo.toUpperCase() : null;

    try {
        // 1. Tenta fazer o login
        const response = await fetch('/api/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        // 2. Se o login tiver sucesso...
        if (response.ok) {
            
            // --- LÓGICA DE REDIRECIONAMENTO CORRIGIDA PARA O ALUNO ---
            if (cargo === 'ALUNO') {
                // Se for ALUNO, vai diretamente para o dashboard, onde o main.js carrega o perfil /me
                window.location.href = '/index.html'; 
            } else {
                // Se for PROFESSOR ou COORDENADOR, vai para a seleção de turmas
                window.location.href = '/turmas.html'; 
            }
            // --------------------------------------------------------
            
        } else {
            // Se o login falhar, mostra o erro
            const errorText = await response.text();
            messageContainer.innerHTML = `<div class="error-message">${errorText || 'Usuário ou senha inválidos.'}</div>`;
        }
    } catch (error) {
        console.error('Erro ao tentar login:', error);
        messageContainer.innerHTML = '<div class="error-message">Erro de conexão.</div>';
    }
});