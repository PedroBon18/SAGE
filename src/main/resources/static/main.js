// Rótulos globais para o histórico (Três períodos)
const periodos = ['1º Trim.', '2º Trim.', '3º Trim.']; 
// Matérias padrão do sistema (sempre exibidas no radar e listas)
const MATERIAS_PADRAO = ['Matemática', 'Português', 'História', 'Geografia', 'Inglês', 'Ciências'];

// --- LÓGICA DE API ---
let listaDeAlunos = []; 
let indiceAtual = 0;
const API_URL = '/api/alunos'; 

// --- Variáveis globais ---
let usuarioCargo = null;  
let usuarioMateria = null;
let turmaAtual = null; // Guarda o NOME da turma vindo do URL
// ----------------------------------------------------------------

const alunoPlaceholder = {
    nome: 'Adicionar Aluno',
    matricula: '????',
    media: 0, 
    turma: '', 
    notas: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
    faltasPorMateria: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
    
    // --- (INÍCIO) CORREÇÃO DO TOTAL DE AULAS PARA 100 ---
    // Usado para definir o limite MÁXIMO do input de faltas
    aulasTotaisPorMateria: { 'Matemática': 100, 'Português': 100, 'História': 100, 'Geografia': 100, 'Inglês': 100, 'Ciências': 100 },
    // --- (FIM) CORREÇÃO DO TOTAL DE AULAS ---

    anotacao: 'Use o hexágono central para adicionar um novo registro.',
    metas: 'Novo registro. Preencha os dados.',
    feedback: 'Nenhum feedback registrado.',
    alerta: 'Aguardando novo aluno.',
    classeFoto: 'AlunoPlaceholder',
    historicoMedia: [0, 0, 0],
    id: null,
    fotoBase64: null,
    instituicao: null 
};
// --------------------------


// --- Seletores de elementos ---
const nomeAlunoElemento = document.getElementById('studentName');
const matriculaAlunoElemento = document.getElementById('studentID');
const alunoTurmaElemento = document.getElementById('alunoTurma'); 
const mediaAlunoElemento = document.getElementById('studentAverage');
const listaNotasElemento = document.getElementById('gradesList');
const anotacoesElemento = document.getElementById('notes');
const fotoElemento = document.getElementById('photo');
const mediaBarElemento = document.getElementById('studentAverageBar');
const listaFrequenciaElemento = document.getElementById('frequencyList'); 
const metasElemento = document.getElementById('studentGoals');
const feedbackElemento = document.getElementById('studentFeedback');
const alertaElemento = document.getElementById('studentAlert');
const gradeTrim1Input = document.getElementById('gradeTrim1');
const gradeTrim2Input = document.getElementById('gradeTrim2');
const gradeTrim3Input = document.getElementById('gradeTrim3');
const rankElemento = document.getElementById('studentRank');
const photoFrameElement = document.getElementById('photoFrame'); 
const fileInputElement = document.getElementById('fileInput'); 

// --- Seletor do Botão de Logout ---
const btnLogout = document.getElementById('btn-logout');
// -----------------------------------------

// --- Seletores de Filtros ---
const freqFilterContainer = document.getElementById('frequencyFilterContainer');
const freqFilterCheckboxes = document.getElementById('frequencyFilterCheckboxes');
const gradesFilterContainer = document.getElementById('gradesFilterContainer');
const gradesFilterCheckboxes = document.getElementById('gradesFilterCheckboxes');

// --- Seletor de Input de Turma (Cria um placeholder se não existir) ---
let turmaInputElemento = document.getElementById('studentTurmaInput');
if (!turmaInputElemento) {
    turmaInputElemento = { value: '', disabled: true, addEventListener: () => {} };
}
// ------------------------------------

// Variáveis globais para os Gráficos
let radarChart;
let doughnutChart;
let lineChart; 
const radarCtx = document.getElementById('radarChart')?.getContext('2d');
const doughnutCtx = document.getElementById('doughnutChart')?.getContext('2d');
const lineCtx = document.getElementById('lineChart')?.getContext('2d'); 

// --- FUNÇÕES DE API ---

// --- LÓGICA PARA APAGAR ALUNO ---
async function handleApagarAluno(alunoId, nomeAluno) {
    if (alunoId === null || alunoId === undefined) return;
    
    if (!confirm(`Tem certeza que deseja apagar permanentemente o aluno "${nomeAluno}"? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${alunoId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert(`Aluno ${nomeAluno} apagado com sucesso!`);
            
            // 1. Fecha o modal de detalhes (se estiver aberto)
            const detalhesModal = document.getElementById('detalhes-modal');
            if (detalhesModal) {
                 detalhesModal.style.display = 'none';
            }
            
            // 2. Remove o aluno da lista e ajusta o índice
            listaDeAlunos = listaDeAlunos.filter(a => a.id !== alunoId);
            
            // 3. Garante que o índice atual é válido
            if (indiceAtual >= listaDeAlunos.length - 1) { 
                indiceAtual = 0;
            }
            
            // 4. Recarrega a lista de alunos da turma atual (para refletir a eliminação)
            // (Passa null como ID selecionado para recarregar no primeiro)
            carregarAlunosDaAPI(turmaAtual, null); 

        } else if (response.status === 403) {
            alert("Acesso negado. Você não tem permissão para apagar alunos desta instituição.");
        } else {
            throw new Error(`Falha ao apagar aluno. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao apagar aluno:', error);
        alert('Erro ao processar a eliminação.');
    }
}
// ---------------------------------


// 1. Função de inicialização (Lendo turma E alunoId)
async function initApp() {
    // Pega os parâmetros do URL
    const params = new URLSearchParams(window.location.search);
    turmaAtual = params.get('turma');
    
    // Pega o ID do aluno selecionado
    const alunoIdSelecionado = params.get('alunoId'); // Ex: "123"

    if (!turmaAtual) {
        // Se nenhuma turma foi passada, tenta buscar o usuário mesmo assim
        // (necessário para o fluxo do ALUNO)
        await buscarDadosUsuario(alunoIdSelecionado); // Passa o ID
    } else {
        // Define o placeholder para já ter a turma correta
        alunoPlaceholder.turma = turmaAtual;
        await buscarDadosUsuario(alunoIdSelecionado); // Passa o ID
    }
}


// 2. Busca os dados (Cargo e Matéria) do usuário logado
async function buscarDadosUsuario(alunoIdSelecionado) { // Recebe o ID
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
        
        console.log(`Usuário logado. Cargo: ${usuarioCargo}, Matéria: ${usuarioMateria || 'N/A'}`);

        // 3. Carrega os alunos.
        
        if (usuarioCargo === 'ALUNO') {
             // Alunos não precisam de turma, carregam a si mesmos
            document.getElementById('alunoTurma').textContent = 'Meu Perfil';
            // Passa o ID (será ignorado pela lógica /me, mas mantém consistência)
            carregarAlunosDaAPI(turmaAtual, alunoIdSelecionado); 
            
        } else if (turmaAtual) {
            // Professor/Coordenador com turma no URL
            // Passa o ID para carregar o aluno correto
            carregarAlunosDaAPI(turmaAtual, alunoIdSelecionado);
            
        } else {
            // Professor/Coordenador sem turma no URL (deve voltar para seleção)
            window.location.href = '/turmas.html'; 
        }

    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }
}


// 3. Função para CRIAR um novo aluno (SÓ para Professor/Coordenador)
async function handleCriarNovoAluno() {
    // Segurança no front-end: só PROFESSOR/COORDENADOR podem criar
    if (!usuarioCargo || (usuarioCargo !== 'PROFESSOR' && usuarioCargo !== 'COORDENADOR')) {
        alert('Ação não permitida. Faça login como Professor ou Coordenador para criar um aluno.');
        return;
    }
    if (!turmaAtual) {
        alert("Erro: A turma atual não está definida.");
        return;
    }
    
    console.log(`Iniciando criação de novo aluno na turma ${turmaAtual}...`);

    const novoAlunoPadrao = {
        nome: "Novo Aluno",
        matricula: `MAT-${Math.floor(Math.random() * 9000) + 1000}`, 
        media: 0,
        turma: turmaAtual, // Define a turma atual no novo aluno
        notas: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
        faltasPorMateria: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
        
        aulasTotaisPorMateria: alunoPlaceholder.aulasTotaisPorMateria,

        anotacao: '', metas: '', feedback: '', alerta: '',
        classeFoto: 'DefaultProfile', 
        historicoMedia: [0, 0, 0], fotoBase64: null
    };

    try {
        console.log('Enviando requisição para criar novo aluno...');
        const response = await fetch(API_URL, { // POST /api/alunos
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify(novoAlunoPadrao),
        });

        console.log(`Status da resposta: ${response.status} ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            console.log('Recebeu HTML em vez de JSON - provavelmente deslogado');
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            let errorMessage = `Erro ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                const text = await response.text();
                errorMessage = text || errorMessage;
            }

            if (response.status === 401) {
                console.log('Não autenticado - redirecionando para login');
                window.location.href = '/login.html';
                return;
            } else if (response.status === 403) {
                alert('Acesso negado. Seu usuário não tem permissão para criar alunos.');
            } else {
                alert(`Falha ao criar novo aluno: ${errorMessage}`);
            }
            throw new Error(`Falha ao criar novo aluno: ${errorMessage}`);
        }

        const alunoSalvo = await response.json(); 
        console.log("Aluno salvo no BD:", alunoSalvo);

        const placeholderIndex = listaDeAlunos.findIndex(a => a.matricula === '????');
        if (placeholderIndex !== -1) {
            listaDeAlunos[placeholderIndex] = alunoSalvo;
        } else {
            listaDeAlunos.push(alunoSalvo);
        }

        if (!listaDeAlunos.some(a => a.matricula === '????')) {
            listaDeAlunos.push(alunoPlaceholder);
        }

        indiceAtual = listaDeAlunos.findIndex(a => a.id === alunoSalvo.id);
        if (indiceAtual === -1) indiceAtual = 0;
        renderizarAluno(indiceAtual);

        nomeAlunoElemento.focus();
        try {
            const range = document.createRange();
            range.selectNodeContents(nomeAlunoElemento);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } catch (e) {
            document.execCommand && document.execCommand('selectAll', false, null);
        }

    } catch (error) {
        console.error('Erro ao criar novo aluno:', error);
    }
}


// 4. Função para salvar atualizações no back-end (SÓ para Professor/Coordenador)
async function salvarAtualizacoesAluno(aluno) {
    if (aluno.matricula === '????' || !aluno.id || usuarioCargo === 'ALUNO') return; // Não salva se for placeholder ou aluno
    try {
        const response = await fetch(`${API_URL}/${aluno.id}`, { // PUT /api/alunos/{id}
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aluno), 
        });
        if (!response.ok) {
            if(response.status === 403) alert("Erro: Não tem permissão para editar este aluno.");
            throw new Error('Falha ao salvar dados do aluno.');
        }
        console.log(`Aluno ${aluno.nome} (ID: ${aluno.id}) salvo com sucesso!`);
        calcularRanking(); 
        rankElemento.textContent = `Rank ${aluno.rank}`;
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}


// 5. Função para carregar dados da API (Lógica de ID de Aluno)
async function carregarAlunosDaAPI(turmaNome, alunoIdSelecionado) { // Recebe o ID
    let url = API_URL;
    const isAluno = usuarioCargo === 'ALUNO';

    if (isAluno) {
        url = `${API_URL}/me`; // Chama: /api/alunos/me
    } else if (turmaNome) {
        url = `${API_URL}?turma=${encodeURIComponent(turmaNome)}`; // Chama: /api/alunos?turma=...
    } else {
        // Professor/Coordenador sem turma válida (tratado no initApp)
        listaDeAlunos = [alunoPlaceholder];
        indiceAtual = 0;
        calcularRanking(); 
        if (!radarChart) inicializarGraficos(); 
        renderizarAluno(indiceAtual);
        return;
    }
    
    try {
        const response = await fetch(url); 
        if (!response.ok) throw new Error('Erro ao buscar dados da API');
        
        let indiceAlvo = 0;
        
        if (isAluno) {
            const alunoLogado = await response.json();
            listaDeAlunos = [alunoLogado];
            // indiceAlvo = 0 (correto para aluno)
            console.log(`Aluno ${alunoLogado.nome} carregado.`);
            turmaAtual = alunoLogado.turma; 

        } else {
            // Professor/Coordenador
            let alunosCarregados = await response.json(); 
            
            if(alunosCarregados.length === 0) {
                 listaDeAlunos = [alunoPlaceholder];
                 // indiceAlvo = 0 (correto para placeholder)
            } else {
                listaDeAlunos = alunosCarregados;
                
                // Procura o ID selecionado vindo do URL
                if (alunoIdSelecionado) {
                    // Usa '==' para comparar string da URL com número do ID
                    const foundIndex = listaDeAlunos.findIndex(aluno => aluno.id == alunoIdSelecionado); 
                    
                    if (foundIndex !== -1) {
                        indiceAlvo = foundIndex; // Encontrou o aluno!
                    }
                    // Se não encontrar, indiceAlvo permanece 0
                }
                
                // Adiciona o placeholder
                listaDeAlunos.push(alunoPlaceholder);
            }
        }
        
        indiceAtual = indiceAlvo;

        calcularRanking(); 
        if (!radarChart) inicializarGraficos(); 
        
        renderizarAluno(indiceAtual);

    } catch (error) {
        console.error('Falha ao carregar alunos:', error);
        if (isAluno) {
            alert("Não foi possível carregar os seus dados. Verifique a sua matrícula.");
        }
        
    }
}

// -------------------------------

// Funções de Ranking e Gráficos
function calcularRanking() {
    const alunosReais = listaDeAlunos.filter(a => a.matricula !== '????');
    const alunosOrdenados = [...alunosReais].sort((a, b) => b.media - a.media);
    alunosOrdenados.forEach((aluno, index) => {
        aluno.rank = index + 1;
    });
    const placeholder = listaDeAlunos.find(a => a.matricula === '????');
    if (placeholder) placeholder.rank = 'N/A';
}

const radarConfig = { 
    type: 'radar',
    data: { 
        labels: [], 
        datasets: [{ 
            label: 'Notas', 
            data: [], 
            backgroundColor: 'rgba(100, 255, 218, 0.2)', 
            borderColor: '#00ccff', 
            pointBackgroundColor: '#00ccff', 
            pointBorderColor: '#fff', 
            pointHoverBackgroundColor: '#fff', 
            pointHoverBorderColor: '#00ccff', 
            borderWidth: 2, 
            fill: true 
        }] 
    }, 
    options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
            legend: { 
                display: false 
            }, 
        }, 
        scales: { 
            r: { 
                angleLines: { 
                    color: 'rgba(173, 216, 230, 0.3)' 
                }, 
                grid: { 
                    color: 'rgba(173, 216, 230, 0.3)', 
                    circular: false 
                }, 
                pointLabels: { 
                    color: '#ccd6f6', 
                    font: { 
                        size: 14 
                    } 
                }, 
                suggestedMin: 0, 
                suggestedMax: 10, 
                ticks: { 
                    backdropColor: 'transparent', 
                    color: '#a8b2d1', 
                    stepSize: 2 
                } 
            } 
        } 
    } 
};

const doughnutConfig = { type: 'doughnut', data: { labels: ['Presença (%)', 'Faltas (%)'], datasets: [{ data: [], backgroundColor: [ '#64ffda', '#ff4d4d' ], hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a8b2d1' } } }, cutout: '80%', } };
const lineConfig = { type: 'line', data: { labels: periodos, datasets: [{ label: 'Média Geral', data: [], borderColor: '#64ffda', backgroundColor: 'rgba(100, 255, 218, 0.1)', borderWidth: 2, tension: 0.4, pointRadius: 6, pointBackgroundColor: '#fff', fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Evolução da Média Geral', color: '#ccd6f6', font: { size: 16 } } }, scales: { y: { min: 0, max: 10, ticks: { color: '#a8b2d1', stepSize: 2 }, grid: { color: '#1e3c72' } }, x: { ticks: { color: '#a8b2d1' }, grid: { display: false } } } } };

function inicializarGraficos() {
    if (radarCtx && !radarChart) radarChart = new Chart(radarCtx, radarConfig);
    if (doughnutCtx && !doughnutChart) doughnutChart = new Chart(doughnutCtx, doughnutConfig);
    if (lineCtx && !lineChart) lineChart = new Chart(lineCtx, lineConfig);
}

function aplicarFiltros(listaCheckboxesElemento, listaItensElemento) {
    const materiasSelecionadas = new Set();
    const checkboxes = listaCheckboxesElemento.querySelectorAll('input[type="checkbox"]:checked');
    
    checkboxes.forEach(cb => {
        materiasSelecionadas.add(cb.value);
    });

    listaItensElemento.querySelectorAll('li').forEach(item => {
        const materiaDoItem = item.getAttribute('data-materia');
        
        if (materiasSelecionadas.has(materiaDoItem)) {
            item.style.display = 'none'; 
        } else {
            item.style.display = ''; 
        }
    });
}

function atualizarGraficoRadar(notas) {
    if (!radarChart) return;
    const labels = MATERIAS_PADRAO;
    const data = labels.map(materia => (notas && notas[materia] !== undefined) ? notas[materia] : 0);
    radarChart.data.labels = labels;
    radarChart.data.datasets[0].data = data;
    radarChart.update();
}

function atualizarGraficoRosca(faltasPorMateria) { 
    if (!doughnutChart) return;

    let totalFaltas = 0;
    const totalAulasBruto = 100; 

    if (faltasPorMateria) {
        MATERIAS_PADRAO.forEach(materia => {
             totalFaltas += (faltasPorMateria[materia] || 0);
        });
    }
    
    if (totalFaltas > totalAulasBruto) {
        totalFaltas = totalAulasBruto;
    }

    const totalPresente = Math.max(0, totalAulasBruto - totalFaltas);
    
    doughnutChart.data.datasets[0].data = [totalPresente, totalFaltas];
    doughnutChart.update();
}

function atualizarGraficoLinha(historicoMedia) { if (lineChart) { lineChart.data.datasets[0].data = historicoMedia; lineChart.update(); } }
function atualizarMedia(aluno) { let soma = 0, quant = 0; const notas = aluno.notas || {}; for (let mat in notas) { soma += notas[mat]; quant++; } const media = (quant > 0) ? Math.min(soma / quant, 10).toFixed(2) : 0; aluno.media = parseFloat(media); mediaAlunoElemento.textContent = media; mediaBarElemento.style.width = (media * 10) + '%'; calcularRanking(); rankElemento.textContent = `Rank ${aluno.rank}`; atualizarGraficoRadar(aluno.notas); }

// --- Função principal de renderização (COM REGRAS DO ALUNO e LOGOUT) ---
function renderizarAluno(indice) {
    calcularRanking(); 
    const aluno = listaDeAlunos[indice];
    const ehPlaceholder = aluno.matricula === '????';

    nomeAlunoElemento.textContent = aluno.nome;
    matriculaAlunoElemento.textContent = aluno.matricula;
    alunoTurmaElemento.textContent = `Turma: ${aluno.turma || 'N/A'}`; 
    listaNotasElemento.innerHTML = ''; 
    listaFrequenciaElemento.innerHTML = ''; 
    rankElemento.textContent = `Rank ${aluno.rank}`;
    
    // Limpa os filtros
    freqFilterContainer.style.display = 'none';
    freqFilterCheckboxes.innerHTML = '';
    gradesFilterContainer.style.display = 'none';
    gradesFilterCheckboxes.innerHTML = '';

    // Lógica da Foto
    fotoElemento.className = 'photo'; 
    fotoElemento.style.backgroundImage = ''; 
    photoFrameElement.classList.add('clickable'); 
    if (aluno.fotoBase64) fotoElemento.style.backgroundImage = `url(${aluno.fotoBase64})`;
    else if (aluno.classeFoto) fotoElemento.classList.add(aluno.classeFoto);

    // Gráficos
    atualizarGraficoRadar(aluno.notas || {}); 
    atualizarGraficoRosca(aluno.faltasPorMateria || {}); 
    atualizarGraficoLinha(aluno.historicoMedia || [0, 0, 0]); 

    // Popula Trimestre
    const [t1, t2, t3] = aluno.historicoMedia || [0, 0, 0]; 
    gradeTrim1Input.value = t1 !== undefined ? t1 : '';
    gradeTrim2Input.value = t2 !== undefined ? t2 : '';
    gradeTrim3Input.value = t3 !== undefined ? t3 : '';
    
    // Popula o input de turma
    if (turmaInputElemento) {
        turmaInputElemento.value = aluno.turma || turmaAtual;
    }

    // --- LÓGICA DE PERMISSÃO ---
    const isCoordenador = usuarioCargo === 'COORDENADOR';
    const isProfessor = usuarioCargo === 'PROFESSOR';
    const isAluno = usuarioCargo === 'ALUNO'; 
    
    const podeEditarCamposGerais = !ehPlaceholder && !isAluno && (isCoordenador || isProfessor);
    const podeEditarNotas = (materia) => !ehPlaceholder && !isAluno && (isCoordenador || (isProfessor && materia === usuarioMateria));
    const podeEditarFaltas = (materia) => !ehPlaceholder && !isAluno && (isCoordenador || (isProfessor && materia === usuarioMateria));
    // ----------------------------
    

    // --- LÓGICA DE CONTROLO DO ALUNO (E BOTÃO LOGOUT) ---
    const navRow = document.querySelector('.nav-row');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const btnApagar = document.getElementById('detalhes-btn-apagar');
    // const btnSalvar = document.getElementById('saveButton'); // Este ID não parece existir no HTML

    // --- (ALTERAÇÃO) MOSTRA O BOTÃO DE LOGOUT PARA TODOS OS UTILIZADORES ---
    // (A linha foi movida para aqui, fora das condições)
    if (btnLogout) btnLogout.style.display = 'block';
    // -----------------------------------------------------------------
    
    if (isAluno) {
        // Mostra a nav-row (para ver a foto), mas esconde os botões de navegação
        if (navRow) navRow.style.display = 'flex'; 
        if (prevButton) prevButton.style.display = 'none';
        if (nextButton) nextButton.style.display = 'none';

        // Aluno não pode apagar/salvar
        if (btnApagar) btnApagar.style.display = 'none';
        // if (btnSalvar) btnSalvar.style.display = 'none'; 
        
        // Impede o clique na foto
        photoFrameElement.classList.remove('clickable'); 

        // (Linha de mostrar o logout foi removida daqui)

    } else {
        // Professor/Coordenador (lógica normal)
        if (navRow) navRow.style.display = 'flex';
        if (prevButton) prevButton.style.display = ''; 
        if (nextButton) nextButton.style.display = ''; 

        // if (btnSalvar) btnSalvar.style.display = 'block';
        if (btnApagar) btnApagar.style.display = ehPlaceholder ? 'none' : 'block';
        photoFrameElement.classList.add('clickable'); 
        
        // (Linha de esconder o logout foi removida daqui)
    }
    // --- FIM DA LÓGICA DE CONTROLO DO ALUNO ---


    // --- LÓGICA PARA ESCONDER ANOTAÇÕES DO ALUNO ---
    const h3Anotacoes = anotacoesElemento.previousElementSibling; 
    
    if (isAluno) {
        if (h3Anotacoes && h3Anotacoes.tagName === 'H3') {
             h3Anotacoes.style.display = 'none';
        }
        anotacoesElemento.style.display = 'none';
    } else {
        if (h3Anotacoes && h3Anotacoes.tagName === 'H3') {
             h3Anotacoes.style.display = 'block';
        }
        anotacoesElemento.style.display = 'block';
    }
    // --- FIM DA LÓGICA PARA ESCONDER ANOTAÇÕES DO ALUNO ---


    // --- Recria os inputs de NOTA (Com Filtro) ---
    const notasMap = aluno.notas || {};
    const faltasMap = aluno.faltasPorMateria || {};
    
    const aulasMap = (aluno.aulasTotaisPorMateria && Object.keys(aluno.aulasTotaisPorMateria).length > 0)
                     ? aluno.aulasTotaisPorMateria
                     : alunoPlaceholder.aulasTotaisPorMateria;

    MATERIAS_PADRAO.forEach((materia) => {
        
        if (!ehPlaceholder && !isAluno) {
            gradesFilterContainer.style.display = 'block'; 
            
            const filtroLi = document.createElement('li');
            const filtroInput = document.createElement('input');
            filtroInput.type = 'checkbox';
            filtroInput.id = `filtro-nota-${materia}`;
            filtroInput.value = materia;
            
            filtroInput.addEventListener('change', () => {
                aplicarFiltros(gradesFilterCheckboxes, listaNotasElemento);
            });

            const filtroLabel = document.createElement('label');
            filtroLabel.htmlFor = `filtro-nota-${materia}`;
            filtroLabel.textContent = materia;

            filtroLi.appendChild(filtroInput);
            filtroLi.appendChild(filtroLabel);
            gradesFilterCheckboxes.appendChild(filtroLi);
        }

        const itemLista = document.createElement('li');
        itemLista.setAttribute('data-materia', materia); 
        const rotuloMateria = document.createElement('span');
        rotuloMateria.textContent = materia;
        const inputNota = document.createElement('input');
        inputNota.type = 'number';
        inputNota.min = 0;
        inputNota.max = 10;
        inputNota.step = 0.1;
        inputNota.value = (notasMap[materia] !== undefined) ? notasMap[materia] : 0; 
        inputNota.classList.add('grade-input'); 

        if (!podeEditarNotas(materia) || isAluno) { 
            inputNota.disabled = true;
        }

        if (!isAluno) { 
             inputNota.addEventListener('change', () => {
                let novoValor = parseFloat(inputNota.value);
                if (novoValor > 10) novoValor = 10;
                if (novoValor < 0 || isNaN(novoValor)) novoValor = 0;
                inputNota.value = novoValor;
                if (!aluno.notas) aluno.notas = {};
                aluno.notas[materia] = novoValor;
                atualizarMedia(aluno); 
                salvarAtualizacoesAluno(aluno); 
            });
        }

        itemLista.appendChild(rotuloMateria);
        itemLista.appendChild(inputNota);
        listaNotasElemento.appendChild(itemLista);
    });

    // --- Recria os inputs de FALTA (Com Filtro) ---
    MATERIAS_PADRAO.forEach((materia) => {
        const deveMostrarFalta = isCoordenador || isAluno || (isProfessor && materia === usuarioMateria);

        if (!deveMostrarFalta) return;

        if (isCoordenador && !ehPlaceholder && !isAluno) {
            freqFilterContainer.style.display = 'block'; 
            
            const filtroLi = document.createElement('li');
            const filtroInput = document.createElement('input');
            filtroInput.type = 'checkbox';
            filtroInput.id = `filtro-freq-${materia}`;
            filtroInput.value = materia;
            
            filtroInput.addEventListener('change', () => {
                aplicarFiltros(freqFilterCheckboxes, listaFrequenciaElemento);
            });

            const filtroLabel = document.createElement('label');
            filtroLabel.htmlFor = `filtro-freq-${materia}`;
            filtroLabel.textContent = materia;

            filtroLi.appendChild(filtroInput);
            filtroLi.appendChild(filtroLabel);
            freqFilterCheckboxes.appendChild(filtroLi);
        }

        const itemLista = document.createElement('li');
        itemLista.setAttribute('data-materia', materia); 

        const rotuloMateria = document.createElement('span');
        rotuloMateria.textContent = materia;
        const inputFalta = document.createElement('input');
        inputFalta.type = 'number';
        inputFalta.min = 0;
        
        const maxAulas = (aulasMap && aulasMap[materia] !== undefined) ? aulasMap[materia] : 100;
        
        inputFalta.max = maxAulas;
        inputFalta.value = (faltasMap && faltasMap[materia] !== undefined) ? faltasMap[materia] : 0; 
        inputFalta.classList.add('grade-input'); 

        if (!podeEditarFaltas(materia) || isAluno) { 
            inputFalta.disabled = true;
        }

        if (!isAluno) {
             inputFalta.addEventListener('change', () => {
                let novoValor = parseInt(inputFalta.value);
                if (novoValor > maxAulas) novoValor = maxAulas;
                    if (novoValor < 0 || isNaN(novoValor)) novoValor = 0;
                    inputFalta.value = novoValor;
                    
                    if (!aluno.faltasPorMateria) aluno.faltasPorMateria = {};
                    
                    aluno.faltasPorMateria[materia] = novoValor;
                    
                    atualizarGraficoRosca(aluno.faltasPorMateria); 
                    salvarAtualizacoesAluno(aluno); 
                });
            }

            itemLista.appendChild(rotuloMateria);
            itemLista.appendChild(inputFalta);
            listaFrequenciaElemento.appendChild(itemLista);
    });

    // Popula campos gerais
    anotacoesElemento.textContent = aluno.anotacao || '';
    metasElemento.textContent = aluno.metas || '';
    feedbackElemento.textContent = aluno.feedback || '';
    alertaElemento.textContent = aluno.alerta || ''; 

    // Média e Barra
    mediaAlunoElemento.textContent = (aluno.media || 0).toFixed(2);
    mediaBarElemento.style.width = (aluno.media * 10) + '%';
    
    // Desativação geral
    const inputsHistorico = document.querySelectorAll('.historical-input');
    inputsHistorico.forEach(input => input.disabled = !podeEditarCamposGerais || isAluno);
    
    if (turmaInputElemento) {
        turmaInputElemento.disabled = !isCoordenador || ehPlaceholder || isAluno;
    }
    
    const editaveis = document.querySelectorAll('#studentName, #notes, #studentAlert, #studentGoals, #studentFeedback');
    editaveis.forEach(caixa => caixa.contentEditable = podeEditarCamposGerais && !isAluno);

    // Aplica os filtros uma vez no final da renderização
    aplicarFiltros(gradesFilterCheckboxes, listaNotasElemento);
    aplicarFiltros(freqFilterCheckboxes, listaFrequenciaElemento);
}
// --- FIM DO RENDERIZAR ---


// --- Event Listeners ---
function handleHistoricalGradeChange(inputElement, trimestreIndex) {
    const aluno = listaDeAlunos[indiceAtual];
    if (!aluno || aluno.matricula === '????' || usuarioCargo === 'ALUNO') return; 
    let novoValor = parseFloat(inputElement.value);
    if (isNaN(novoValor)) novoValor = 0;
    if (novoValor > 10) novoValor = 10;
    if (novoValor < 0) novoValor = 0;
    inputElement.value = novoValor;
    if (!aluno.historicoMedia) aluno.historicoMedia = [0, 0, 0];
    aluno.historicoMedia[trimestreIndex] = novoValor;
    atualizarGraficoLinha(aluno.historicoMedia);
    salvarAtualizacoesAluno(aluno); 
}
gradeTrim1Input.addEventListener('change', () => handleHistoricalGradeChange(gradeTrim1Input, 0));
gradeTrim2Input.addEventListener('change', () => handleHistoricalGradeChange(gradeTrim2Input, 1));
gradeTrim3Input.addEventListener('change', () => handleHistoricalGradeChange(gradeTrim3Input, 2));

function addBlurSaveListener(element, property) {
    element.addEventListener('blur', () => {
        const alunoAtual = listaDeAlunos[indiceAtual];
        if (!alunoAtual || alunoAtual.matricula === '????' || usuarioCargo === 'ALUNO') return; 
        
        let novoTexto;
        if (element.isContentEditable) {
            novoTexto = element.textContent.trim();
        } else {
            novoTexto = element.value.trim();
        }
        
        if (novoTexto !== alunoAtual[property]) {
            alunoAtual[property] = novoTexto;
            salvarAtualizacoesAluno(alunoAtual); 
        }
    });
    element.addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') { 
            e.preventDefault(); 
            e.target.blur(); 
        }
    });
}
addBlurSaveListener(nomeAlunoElemento, 'nome');
addBlurSaveListener(anotacoesElemento, 'anotacao');
addBlurSaveListener(alertaElemento, 'alerta');
addBlurSaveListener(metasElemento, 'metas');
addBlurSaveListener(feedbackElemento, 'feedback');

if (turmaInputElemento) {
    addBlurSaveListener(turmaInputElemento, 'turma'); 
}


document.getElementById('prev').addEventListener('click', () => {
    if (usuarioCargo === 'ALUNO') return; 
    indiceAtual = (indiceAtual - 1 + listaDeAlunos.length) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});
document.getElementById('next').addEventListener('click', () => {
    if (usuarioCargo === 'ALUNO') return; 
    indiceAtual = (indiceAtual + 1) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});

photoFrameElement.addEventListener('click', () => {
    console.log('photoFrame click', { usuarioCargo, turmaAtual, indiceAtual });
    const aluno = listaDeAlunos[indiceAtual];
    console.log('current aluno on click:', aluno);
    if (usuarioCargo === 'ALUNO') return; 
    if (!aluno) return;
    if (aluno.matricula === '????') {
        console.log('Placeholder detected - calling handleCriarNovoAluno()');
        handleCriarNovoAluno();
    } else {
        fileInputElement.click(); 
    }
});
fileInputElement.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file || usuarioCargo === 'ALUNO') return; 
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64String = e.target.result;
        const alunoAtual = listaDeAlunos[indiceAtual];
        if (!alunoAtual || alunoAtual.matricula === '????') return;
        alunoAtual.fotoBase64 = base64String;
        fotoElemento.style.backgroundImage = `url(${base64String})`;
        salvarAtualizacoesAluno(alunoAtual);
        fileInputElement.value = null;
    };
    reader.readAsDataURL(file);
});

const btnApagarDetalhes = document.getElementById('detalhes-btn-apagar');
if (btnApagarDetalhes) {
    btnApagarDetalhes.addEventListener('click', () => {
        if (usuarioCargo === 'ALUNO') return; 
        const alunoAtual = listaDeAlunos[indiceAtual];
        if (alunoAtual && alunoAtual.id) {
            handleApagarAluno(alunoAtual.id, alunoAtual.nome);
        }
    });
}

// --- Inicializa a aplicação ---
initApp();