document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impede o envio padrão

    const form = event.target;
    const formData = new FormData(form);
    
    // Converte os dados do formulário para um objeto JSON
    const loginData = {};
    formData.forEach((value, key) => {
        // Trata da matéria: se for vazia, envia 'null'
        if (key === 'materia' && value === '') {
            loginData[key] = null;
        } else {
            loginData[key] = value;
        }
    });

    // Garante que o Cargo esteja em maiúsculas
    if (loginData.cargo) {
        loginData.cargo = loginData.cargo.toUpperCase();
    }

    const messageContainer = document.getElementById('message-container');
    messageContainer.innerHTML = ''; // Limpa mensagens antigas

    try {
        const response = await fetch('/api/login', { // A nossa nova API de login
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {
            // Sucesso! O back-end criou a sessão.
            // Redireciona para a página principal.
            window.location.href = '/index.html'; 
        } else {
            // Erro vindo do back-end
            const errorText = await response.text();
            messageContainer.innerHTML = `<div class="error-message">${errorText}</div>`;
        }
    } catch (error) {
        console.error('Erro ao tentar login:', error);
        messageContainer.innerHTML = '<div class="error-message">Erro de conexão.</div>';
    }
});