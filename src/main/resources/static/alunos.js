document.addEventListener('DOMContentLoaded', () => {

    // --- Referências aos elementos do HTML ---
    const grid = document.getElementById('aluno-grid');
    const tituloPagina = document.getElementById('titulo-pagina');
    const messageContainer = document.getElementById('message-container');
    const seletorMateriaContainer = document.getElementById('seletor-materia-container');
    const seletorMateria = document.getElementById('seletor-materia');

    // --- Constantes (copiadas do main.js) ---
    const MATERIAS_PADRAO = ['Matemática', 'Português', 'História', 'Geografia', 'Inglês', 'Ciências'];

    // --- Variáveis Globais ---
    let nomeTurma = null;
    let usuarioCargo = null;
    let usuarioMateria = null;
    let materiaSelecionada = null; // A matéria que está sendo editada
    let listaDeAlunos = []; // Guarda os alunos carregados


    // --- 1. Função principal de inicialização ---
    const iniciarPagina = async () => {
        try {
            // 1.1. Pega o nome da turma da URL
            const urlParams = new URLSearchParams(window.location.search);
            nomeTurma = urlParams.get('turma');

            if (!nomeTurma) {
                tituloPagina.textContent = 'Turma não especificada';
                throw new Error('Nenhuma turma foi selecionada. Volte e selecione uma turma.');
            }
            
            // 1.2. Busca dados do usuário (ESSENCIAL PARA EDIÇÃO)
            await buscarDadosUsuario();

            // 1.3. Configura a UI baseada no cargo
            configurarVisao();

            // 1.4. Carrega a lista de alunos
            await carregarAlunos(nomeTurma);

        } catch (error) {
            console.error('Erro na inicialização:', error);
            showMessage('error', error.message);
        }
    };

    // --- 2. Busca dados do usuário (Cargo/Matéria) ---
    const buscarDadosUsuario = async () => {
        try {
            const response = await fetch('/api/usuario/info');
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            if (!response.ok) throw new Error('Falha ao buscar dados do usuário.');
            
            const dados = await response.json();
            usuarioCargo = dados.cargo ? dados.cargo.toUpperCase() : null;
            usuarioMateria = dados.materia;
            
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            showMessage('error', 'Não foi possível identificar o usuário.');
        }
    };

    // --- 3. Configura a UI (Dropdown ou Matéria Fixa) ---
    const configurarVisao = () => {
        if (usuarioCargo === 'COORDENADOR') {
            tituloPagina.textContent = `Alunos da Turma: ${nomeTurma}`;
            
            // Popula o dropdown
            MATERIAS_PADRAO.forEach(materia => {
                const option = document.createElement('option');
                option.value = materia;
                option.textContent = materia;
                seletorMateria.appendChild(option);
            });
            
            // Define a matéria selecionada inicial
            materiaSelecionada = MATERIAS_PADRAO[0];
            
            // Adiciona evento: se mudar a matéria, recarrega a lista
            seletorMateria.addEventListener('change', (e) => {
                materiaSelecionada = e.target.value;
                // Reconstrói o grid com a nova matéria selecionada
                construirGridAlunos(); 
            });
            
            // Mostra o container do dropdown
            seletorMateriaContainer.style.display = 'block';

        } else if (usuarioCargo === 'PROFESSOR') {
            tituloPagina.textContent = `Alunos da Turma: ${nomeTurma} (Editando: ${usuarioMateria})`;
            // Professor só pode editar a sua própria matéria
            materiaSelecionada = usuarioMateria;
            seletorMateriaContainer.style.display = 'none';

        } else {
            // Aluno ou outro cargo (não deve editar)
            tituloPagina.textContent = `Alunos da Turma: ${nomeTurma}`;
            seletorMateriaContainer.style.display = 'none';
        }
    };

    // --- 4. Função para CARREGAR os alunos da API ---
    const carregarAlunos = async (turma) => {
        try {
            const response = await fetch(`/api/alunos?turma=${encodeURIComponent(turma)}`);
            
            if (!response.ok) {
                if (response.status === 401) window.location.href = '/login.html';
                throw new Error('Falha ao carregar lista de alunos.');
            }

            listaDeAlunos = await response.json(); // Salva na variável global

            if (listaDeAlunos.length === 0) {
                grid.innerHTML = '<p style="color: #8892b0; grid-column: 1 / -1; padding: 10px;">Nenhum aluno encontrado para esta turma.</p>';
                return;
            }

            // Ordena os alunos por nome
            listaDeAlunos.sort((a, b) => a.nome.localeCompare(b.nome));

            // Chama a função que constrói o grid
            construirGridAlunos();

        } catch (error) {
            console.error(error);
            showMessage('error', 'Erro ao carregar alunos.');
        }
    };

    // --- 5. Função para CONSTRUIR (ou reconstruir) o grid de alunos ---
    // Esta função usa a 'listaDeAlunos' global e a 'materiaSelecionada'
    const construirGridAlunos = () => {
        grid.innerHTML = ''; // Limpa o grid

        // Verifica se pode editar (Professor ou Coordenador)
        const podeEditar = (usuarioCargo === 'COORDENADOR' || usuarioCargo === 'PROFESSOR');

        listaDeAlunos.forEach(aluno => {
            const card = document.createElement('div');
            card.className = 'aluno-card';

            // 1. Link para o perfil (como antes)
            const link = document.createElement('a');
            link.className = 'aluno-link';
            link.textContent = aluno.nome; 
            link.href = `/index.html?turma=${encodeURIComponent(nomeTurma)}&alunoId=${aluno.id}`;
            card.appendChild(link);

            // 2. Adiciona campos de edição (SE PUDER EDITAR)
            if (podeEditar && materiaSelecionada) {
                const editContainer = document.createElement('div');
                editContainer.className = 'card-edit-container';

                // Garante que os mapas de notas/faltas existem
                if (!aluno.notas) aluno.notas = {};
                if (!aluno.faltasPorMateria) aluno.faltasPorMateria = {};

                // --- Campo de NOTA ---
                const notaLabel = document.createElement('label');
                notaLabel.textContent = `Nota (${materiaSelecionada.substring(0, 4)}):`;
                const notaInput = document.createElement('input');
                notaInput.type = 'number';
                notaInput.min = 0;
                notaInput.max = 10;
                notaInput.step = 0.1;
                notaInput.value = aluno.notas[materiaSelecionada] || 0;
                
                // Evento para salvar ao mudar
                notaInput.addEventListener('change', () => {
                    let valor = parseFloat(notaInput.value);
                    if (valor > 10) valor = 10;
                    if (valor < 0 || isNaN(valor)) valor = 0;
                    notaInput.value = valor;
                    
                    // Salva a alteração
                    handleSalvarEdicao(aluno, 'nota', valor);
                });

                notaLabel.appendChild(notaInput);
                editContainer.appendChild(notaLabel);

                // --- Campo de FALTAS ---
                const faltaLabel = document.createElement('label');
                faltaLabel.textContent = `Faltas (${materiaSelecionada.substring(0, 4)}):`;
                const faltaInput = document.createElement('input');
                faltaInput.type = 'number';
                faltaInput.min = 0;
                faltaInput.max = 100; // Limite padrão (pode ajustar)
                faltaInput.value = aluno.faltasPorMateria[materiaSelecionada] || 0;

                // Evento para salvar ao mudar
                faltaInput.addEventListener('change', () => {
                    let valor = parseInt(faltaInput.value);
                    if (valor > 100) valor = 100;
                    if (valor < 0 || isNaN(valor)) valor = 0;
                    faltaInput.value = valor;

                    // Salva a alteração
                    handleSalvarEdicao(aluno, 'falta', valor);
                });
                
                faltaLabel.appendChild(faltaInput);
                editContainer.appendChild(faltaLabel);
                
                card.appendChild(editContainer);
            }
            
            grid.appendChild(card);
        });
    };

    // --- 6. Função para lidar com o salvamento da edição ---
    const handleSalvarEdicao = async (aluno, tipo, valor) => {
        if (!materiaSelecionada) return;

        // Atualiza o objeto 'aluno' local primeiro
        if (tipo === 'nota') {
            if (!aluno.notas) aluno.notas = {};
            aluno.notas[materiaSelecionada] = valor;
        } else if (tipo === 'falta') {
            if (!aluno.faltasPorMateria) aluno.faltasPorMateria = {};
            aluno.faltasPorMateria[materiaSelecionada] = valor;
        }

        // Envia a atualização para o back-end
        await salvarAtualizacoesAluno(aluno);
    };

    // --- 7. Função para salvar no back-end (Copiada do main.js) ---
    async function salvarAtualizacoesAluno(aluno) {
        if (!aluno.id) return; 

        try {
            const response = await fetch(`/api/alunos/${aluno.id}`, { // PUT /api/alunos/{id}
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aluno), 
            });
            if (!response.ok) {
                if(response.status === 403) {
                    showMessage("error", "Erro: Permissão negada para editar este aluno.");
                }
                throw new Error('Falha ao salvar dados do aluno.');
            }
            console.log(`Dados salvos para ${aluno.nome}`);
            // Mostra uma mensagem sutil de sucesso
            showMessage('success', `Dados de ${aluno.nome} salvos.`);

        } catch (error) {
            console.error('Erro ao salvar:', error);
            showMessage('error', `Erro ao salvar dados de ${aluno.nome}.`);
        }
    }

    // --- 8. Função para exibir mensagens (reutilizada) ---
    const showMessage = (type, message) => {
        const messageClass = (type === 'success') ? 'success-message' : 'error-message';
        
        // Define estilos se não existirem (para reutilização)
        if (type === 'error' && !document.querySelector('.error-message')) {
            document.head.insertAdjacentHTML('beforeend', `<style> .error-message { background-color: rgba(255, 100, 100, 0.1); border: 1px solid #ff6464; color: #ff6464; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 14px; } </style>`);
        }
        if (type === 'success' && !document.querySelector('.success-message')) {
             document.head.insertAdjacentHTML('beforeend', `<style> .success-message { background-color: rgba(100, 255, 218, 0.1); border: 1px solid #64ffda; color: #64ffda; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 14px; } </style>`);
        }

        // Cria e remove a mensagem
        const msgDiv = document.createElement('div');
        msgDiv.className = messageClass;
        msgDiv.textContent = message;
        messageContainer.appendChild(msgDiv);
        
        setTimeout(() => {
            msgDiv.remove();
        }, 2500); // Mensagem de sucesso dura 2.5s
    };

    // --- 9. Inicia a página ---
    iniciarPagina();
});