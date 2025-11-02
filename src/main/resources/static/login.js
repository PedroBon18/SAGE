document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const form = event.target;
    const formData = new FormData(form);
    
    const loginData = {};
    formData.forEach((value, key) => {
        // (Mantive a tua lógica de login aqui, está correta)
        if (key === 'materia' && value === '') {
            loginData[key] = null;
        } else if (key === 'username') {
             loginData[key] = value.trim(); // Boa prática
        } else {
            loginData[key] = value;
        }
    });

    if (loginData.cargo) {
        loginData.cargo = loginData.cargo.toUpperCase();
    }

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

            // ================== MUDANÇA DO TESTE ==================
            // Vamos redirecionar para o index.html (página segura)
            // em vez do turmas.html (página com bug).
            window.location.href = '/index.html'; 
            // ======================================================

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