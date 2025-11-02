// --- LÓGICA PARA EXIBIR/OCULTAR MATÉRIA ---
document.addEventListener('DOMContentLoaded', () => {
    const cargoSelect = document.getElementById('cargo');
    const materiaContainer = document.getElementById('materia-container');
    const materiaSelect = document.getElementById('materia');

    function toggleMateriaInput() {
        if (cargoSelect.value === 'professor') {
            materiaContainer.style.display = 'block'; // Mostrar
            materiaSelect.setAttribute('required', 'required'); // Torna a matéria obrigatória
        } else {
            materiaContainer.style.display = 'none'; // Esconder
            materiaSelect.removeAttribute('required');
            materiaSelect.value = ""; // Limpar o valor ao esconder
        }
    }

    // Ouve as mudanças no seletor de Cargo
    cargoSelect.addEventListener('change', toggleMateriaInput);
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
        } else if (key === 'username' || key === 'instituicao') { // <-- ALTERAÇÃO AQUI
             loginData[key] = value.trim(); // Remove espaços em branco
        } else {
            loginData[key] = value;
        }
    });

    const messageContainer = document.getElementById('message-container');
    messageContainer.innerHTML = ''; 

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
            // Redireciona para turmas.html (fluxo correto)
            window.location.href = '/turmas.html'; 
        } else {
            // Se o login falhar (ex: 401 Senha errada), mostra o erro
            const errorText = await response.text();
            messageContainer.innerHTML = `<div class="error-message">${errorText || 'Usuário ou senha inválidos.'}</div>`;
        }
    } catch (error) {
        console.error('Erro ao tentar login:', error);
        messageContainer.innerHTML = '<div class="error-message">Erro de conexão.</div>';
    }
});