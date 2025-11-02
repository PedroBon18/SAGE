document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const form = event.target;
    const formData = new FormData(form);
    
    const loginData = {};
    formData.forEach((value, key) => {
        if (key === 'materia' && value === '') {
            loginData[key] = null;
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
        const response = await fetch('/api/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        if (response.ok) {

            // O destino volta a ser 'turmas.html'
            window.location.href = '/turmas.html'; 

        } else {
            const errorText = await response.text();
            messageContainer.innerHTML = `<div class="error-message">${errorText || 'Usuário ou senha inválidos.'}</div>`;
        }
    } catch (error) {
        console.error('Erro ao tentar login:', error);
        messageContainer.innerHTML = '<div class="error-message">Erro de conexão.</div>';
    }
});