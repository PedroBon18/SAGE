document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos elementos do HTML ---
    const grid = document.getElementById('turma-grid');
    const form = document.getElementById('nova-turma-form');
    const nomeTurmaInput = document.getElementById('nova-turma-nome');
    const messageContainer = document.getElementById('message-container');
    const containerCriarTurma = document.getElementById('container-criar-turma');
    const tituloPagina = document.getElementById('titulo-pagina');

    let usuarioCargo = null; // Para guardar o cargo (PROFESSOR ou COORDENADOR)

    // --- 1. Função principal de inicialização ---
    const iniciarPagina = async () => {
        try {
            // 1.1. Busca a informação do usuário logado (cargo e matéria)
            const responseUser = await fetch('/api/usuario/info');
            
            if (responseUser.status === 401) {
                window.location.href = '/login.html'; // Redireciona se não estiver logado
                return;
            }
            if (!responseUser.ok) {
                throw new Error('Falha ao buscar dados do usuário.');
            }
            
            const userInfo = await responseUser.json(); // Ex: { "cargo": "COORDENADOR", "materia": null }
            usuarioCargo = userInfo.cargo;

            // 1.2. Verifica o cargo e ajusta a UI
            if (usuarioCargo === 'COORDENADOR') {
                tituloPagina.textContent = 'Selecione ou Crie uma Turma';
                containerCriarTurma.style.display = 'block'; // Mostra o formulário
                
                // Configura o 'submit' do formulário SÓ se for coordenador
                form.addEventListener('submit', criarNovaTurma);
                
            } else {
                tituloPagina.textContent = 'Selecione uma Turma';
                containerCriarTurma.style.display = 'none'; // Garante que está escondido
            }

            // 1.3. Carrega a lista de turmas para todos
            await carregarTurmas();

        } catch (error) {
            console.error('Erro na inicialização:', error);
            showMessage('error', 'Erro ao carregar dados da página.');
        }
    };

    // --- 2. Função para carregar as turmas (VISÍVEL POR TODOS) ---
    const carregarTurmas = async () => {
        try {
            const response = await fetch('/api/turmas'); // GET /api/turmas
            if (!response.ok) {
                throw new Error('Falha ao carregar turmas.');
            }
            
            const turmas = await response.json(); // Ex: [{"id": 1, "nome": "1A", ...}]
            grid.innerHTML = ''; // Limpa o grid

            if (turmas.length === 0) {
                grid.innerHTML = '<p style="color: #8892b0; grid-column: 1 / -1; padding: 10px;">Nenhuma turma encontrada.</p>';
                if (usuarioCargo === 'COORDENADOR') {
                    grid.innerHTML += '<p style="color: #ccd6f6; grid-column: 1 / -1; text-align: center;">Crie a primeira turma abaixo.</p>';
                }
            }

            turmas.forEach(turma => {
                const card = document.createElement('div');
                card.className = 'turma-card';
                
                // --- MUDANÇA: Link de navegação ---
                // Cria um link <a> em vez de um card clicável
                const link = document.createElement('a');
                link.className = 'turma-link';
                link.textContent = turma.nome;
                // O link redireciona para o index.html (dashboard de alunos)
                link.href = `/index.html?turma=${encodeURIComponent(turma.nome)}`;
                card.appendChild(link);
                
                // --- MUDANÇA: Botão de Apagar (SÓ PARA COORDENADOR) ---
                if (usuarioCargo === 'COORDENADOR') {
                    const btnApagar = document.createElement('button');
                    btnApagar.className = 'btn-apagar';
                    btnApagar.textContent = 'Apagar';
                    btnApagar.onclick = (e) => {
                        e.stopPropagation(); // Impede o clique de ir para o link
                        apagarTurma(turma.id, turma.nome);
                    };
                    card.appendChild(btnApagar);
                }
                
                grid.appendChild(card);
            });

        } catch (error) {
            console.error(error);
            showMessage('error', 'Erro ao carregar turmas.');
        }
    };

    // --- 3. Função para criar uma nova turma (SÓ PARA COORDENADOR) ---
    const criarNovaTurma = async (e) => {
        e.preventDefault();
        const nomeTurma = nomeTurmaInput.value.trim();
        if (!nomeTurma) return;

        try {
            const response = await fetch('/api/turmas', { // POST /api/turmas
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nomeTurma })
            });

            if (response.ok) {
                showMessage('success', `Turma "${nomeTurma}" criada com sucesso!`);
                nomeTurmaInput.value = '';
                carregarTurmas(); // Recarrega a lista
            } else if (response.status === 403) {
                // 403 Forbidden - O Spring Security bloqueou (regra de COORDENADOR)
                showMessage('error', 'Acesso negado. Apenas coordenadores podem criar turmas.');
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro desconhecido');
            }
        } catch (error) {
            console.error(error);
            showMessage('error', error.message);
        }
    };

    // --- 4. Função para Apagar Turma (SÓ PARA COORDENADOR) ---
    const apagarTurma = async (idTurma, nomeTurma) => {
        if (!confirm(`Tem a certeza que deseja apagar a turma "${nomeTurma}"?\n(Atenção: isto pode afetar alunos já associados a ela).`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/turmas/${idTurma}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showMessage('success', `Turma "${nomeTurma}" apagada.`);
                carregarTurmas(); // Recarrega a lista
            } else if (response.status === 403) {
                showMessage('error', 'Acesso negado. Apenas coordenadores podem apagar turmas.');
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao apagar turma.');
            }
        } catch (error) {
            console.error(error);
            showMessage('error', error.message);
        }
    };


    // --- 5. Função para exibir mensagens (Mantida do teu código) ---
    const showMessage = (type, message) => {
        const messageClass = (type === 'success') ? 'success-message' : 'error-message';
        messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;
        
        if (type === 'success' && !document.querySelector('.success-message')) {
            document.head.insertAdjacentHTML('beforeend', `
            <style>
            .success-message {
                background-color: rgba(100, 255, 218, 0.1);
                border: 1px solid #64ffda;
                color: #64ffda;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 15px;
                font-size: 14px;
            }
            </style>`);
        }
        
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 3000);
    };

    // --- 6. Inicia a página ---
    iniciarPagina();
});