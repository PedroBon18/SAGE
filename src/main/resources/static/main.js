// Rótulos globais para o histórico (Três períodos)
const periodos = ['1º Trim.', '2º Trim.', '3º Trim.']; 

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
    aulasTotaisPorMateria: { 'Matemática': 50, 'Português': 50, 'História': 40, 'Geografia': 40, 'Inglês': 30, 'Ciências': 40 },
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

// --- Seletores de Filtros ---
const freqFilterContainer = document.getElementById('frequencyFilterContainer');
const freqFilterCheckboxes = document.getElementById('frequencyFilterCheckboxes');
const gradesFilterContainer = document.getElementById('gradesFilterContainer');
const gradesFilterCheckboxes = document.getElementById('gradesFilterCheckboxes');

// --- Seletor de Input de Turma ---
const turmaInputElemento = document.getElementById('studentTurmaInput');
// ------------------------------------

// Variáveis globais para os Gráficos
let radarChart;
let doughnutChart;
let lineChart; 
const radarCtx = document.getElementById('radarChart')?.getContext('2d');
const doughnutCtx = document.getElementById('doughnutChart')?.getContext('2d');
const lineCtx = document.getElementById('lineChart')?.getContext('2d'); 

// --- FUNÇÕES DE API ---

// 1. ATUALIZADO: Função de inicialização
async function initApp() {
    // Pega o nome da turma do URL (ex: ?turma=1A)
    const params = new URLSearchParams(window.location.search);
    turmaAtual = params.get('turma');

    if (!turmaAtual) {
        // Se nenhuma turma foi passada, volta para a tela de seleção
        alert("Nenhuma turma selecionada!");
        window.location.href = '/turmas.html';
        return;
    }
    
    // Define o placeholder para já ter a turma correta
    alunoPlaceholder.turma = turmaAtual;

    await buscarDadosUsuario();
}


// 2. Busca os dados (Cargo e Matéria) do usuário logado
async function buscarDadosUsuario() {
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

        // 3. Carrega os alunos da turma vinda do URL
        carregarAlunosDaAPI(turmaAtual);

    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }
}


// 3. ATUALIZADO: Função para CRIAR um novo aluno
async function handleCriarNovoAluno() {
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
        aulasTotaisPorMateria: { 'Matemática': 50, 'Português': 50, 'História': 40, 'Geografia': 40, 'Inglês': 30, 'Ciências': 40 },
        anotacao: '', metas: '', feedback: '', alerta: '',
        classeFoto: 'DefaultProfile', 
        historicoMedia: [0, 0, 0], fotoBase64: null
    };

    try {
        const response = await fetch(API_URL, { // POST /api/alunos
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoAlunoPadrao),
        });

        if (!response.ok) throw new Error('Falha ao criar novo aluno.');

        const alunoSalvo = await response.json(); 
        console.log("Aluno salvo no BD:", alunoSalvo);
        
        listaDeAlunos.pop(); 
        listaDeAlunos.push(alunoSalvo); 
        listaDeAlunos.push(alunoPlaceholder); 
        
        indiceAtual = listaDeAlunos.length - 2; 
        renderizarAluno(indiceAtual);

        nomeAlunoElemento.focus();
        document.execCommand('selectAll', false, null); 

    } catch (error) {
        console.error('Erro ao criar novo aluno:', error);
    }
}


// 4. Função para salvar atualizações no back-end
async function salvarAtualizacoesAluno(aluno) {
    if (aluno.matricula === '????' || !aluno.id) return;
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


// 5. ATUALIZADO: Função para carregar dados da API (recebe o nome da turma)
async function carregarAlunosDaAPI(turmaNome) {
    if (!turmaNome) {
        listaDeAlunos = [alunoPlaceholder];
        indiceAtual = 0;
        calcularRanking(); 
        if (!radarChart) inicializarGraficos(); 
        renderizarAluno(indiceAtual);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?turma=${encodeURIComponent(turmaNome)}`); 
        if (!response.ok) throw new Error('Erro ao buscar dados da API');
        
        listaDeAlunos = await response.json(); 
        
        if(listaDeAlunos.length === 0) {
            console.log(`Nenhum aluno encontrado para a turma ${turmaNome}.`);
        }
        
        listaDeAlunos.push(alunoPlaceholder);
        indiceAtual = 0; 
        
        calcularRanking(); 
        if (!radarChart) inicializarGraficos(); 
        renderizarAluno(indiceAtual);

    } catch (error) {
        console.error('Falha ao carregar alunos:', error);
    }
}

// -------------------------------

// Funções de Ranking e Gráficos (Sem alterações)
function calcularRanking() {
    const alunosReais = listaDeAlunos.filter(a => a.matricula !== '????');
    const alunosOrdenados = [...alunosReais].sort((a, b) => b.media - a.media);
    alunosOrdenados.forEach((aluno, index) => {
        aluno.rank = index + 1;
    });
    const placeholder = listaDeAlunos.find(a => a.matricula === '????');
    if (placeholder) placeholder.rank = 'N/A';
}
const radarConfig = { type: 'radar', data: { labels: [], datasets: [{ label: 'Notas', data: [], backgroundColor: 'rgba(100, 255, 218, 0.2)', borderColor: '#64ffda', pointBackgroundColor: '#64ffda', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#64ffda', borderWidth: 2, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, }, scales: { r: { angleLines: { color: '#495c80' }, grid: { color: '#495c80' }, pointLabels: { color: '#ccd6f6', font: { size: 14 } }, suggestedMin: 0, suggestedMax: 10, ticks: { backdropColor: '#112240', color: '#a8b2d1', stepSize: 2 } } } } };
const doughnutConfig = { type: 'doughnut', data: { labels: ['Presença (%)', 'Faltas (%)'], datasets: [{ data: [], backgroundColor: [ '#64ffda', '#ff4d4d' ], hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a8b2d1' } } }, cutout: '80%', } };
const lineConfig = { type: 'line', data: { labels: periodos, datasets: [{ label: 'Média Geral', data: [], borderColor: '#64ffda', backgroundColor: 'rgba(100, 255, 218, 0.1)', borderWidth: 2, tension: 0.4, pointRadius: 6, pointBackgroundColor: '#fff', fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Evolução da Média Geral', color: '#ccd6f6', font: { size: 16 } } }, scales: { y: { min: 0, max: 10, ticks: { color: '#a8b2d1', stepSize: 2 }, grid: { color: '#1e3c72' } }, x: { ticks: { color: '#a8b2d1' }, grid: { display: false } } } } };
function inicializarGraficos() {
    if (radarCtx && !radarChart) radarChart = new Chart(radarCtx, radarConfig);
    if (doughnutCtx && !doughnutChart) doughnutChart = new Chart(doughnutCtx, doughnutConfig);
    if (lineCtx && !lineChart) lineChart = new Chart(lineCtx, lineConfig);
}
function atualizarGraficoRadar(notas) { if (radarChart) { radarChart.data.labels = Object.keys(notas); radarChart.data.datasets[0].data = Object.values(notas); radarChart.update(); } }
function atualizarGraficoRosca(faltasPorMateria, aulasTotaisPorMateria) { if (doughnutChart) { let totalFaltas = 0, totalAulas = 0; if (faltasPorMateria) totalFaltas = Object.values(faltasPorMateria).reduce((soma, faltas) => soma + (faltas || 0), 0); if (aulasTotaisPorMateria) totalAulas = Object.values(aulasTotaisPorMateria).reduce((soma, aulas) => soma + (aulas || 0), 0); const total = Math.max(totalAulas, 1); const percFaltas = (totalFaltas / total) * 100; const percPresente = 100 - percFaltas; doughnutChart.data.datasets[0].data = [percPresente.toFixed(2), percFaltas.toFixed(2)]; doughnutChart.update(); } }
function atualizarGraficoLinha(historicoMedia) { if (lineChart) { lineChart.data.datasets[0].data = historicoMedia; lineChart.update(); } }
function atualizarMedia(aluno) { let soma = 0, quant = 0; const notas = aluno.notas || {}; for (let mat in notas) { soma += notas[mat]; quant++; } const media = (quant > 0) ? Math.min(soma / quant, 10).toFixed(2) : 0; aluno.media = parseFloat(media); mediaAlunoElemento.textContent = media; mediaBarElemento.style.width = (media * 10) + '%'; calcularRanking(); rankElemento.textContent = `Rank ${aluno.rank}`; atualizarGraficoRadar(aluno.notas); }

// --- Função principal de renderização ---
function renderizarAluno(indice) {
    calcularRanking(); 
    const aluno = listaDeAlunos[indice];
    const ehPlaceholder = aluno.matricula === '????';

    nomeAlunoElemento.textContent = aluno.nome;
    matriculaAlunoElemento.textContent = aluno.matricula;
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
    atualizarGraficoRosca(aluno.faltasPorMateria || {}, aluno.aulasTotaisPorMateria || {}); 
    atualizarGraficoLinha(aluno.historicoMedia || [0, 0, 0]); 

    // Popula Trimestre
    const [t1, t2, t3] = aluno.historicoMedia || [0, 0, 0]; 
    gradeTrim1Input.value = t1 !== undefined ? t1 : '';
    gradeTrim2Input.value = t2 !== undefined ? t2 : '';
    gradeTrim3Input.value = t3 !== undefined ? t3 : '';
    
    // ATUALIZADO: Popula o input de turma
    turmaInputElemento.value = aluno.turma || turmaAtual;

    // --- LÓGICA DE PERMISSÃO (Sem alteração) ---
    const isCoordenador = usuarioCargo === 'COORDENADOR';
    const podeEditarCamposGerais = !ehPlaceholder && (isCoordenador || usuarioCargo === 'PROFESSOR');
    const podeEditarNotas = (materia) => !ehPlaceholder && (isCoordenador || (usuarioCargo === 'PROFESSOR' && materia === usuarioMateria));
    const podeEditarFaltas = (materia) => !ehPlaceholder && (isCoordenador || (usuarioCargo === 'PROFESSOR' && materia === usuarioMateria));
    // -----------------------------------------------------------

    // --- Recria os inputs de NOTA (Com Filtro) ---
    const notasMap = aluno.notas || {};
    const materiasBase = Object.keys(notasMap).length > 0 ? notasMap : alunoPlaceholder.notas; 
    
    for (let materia in materiasBase) {
        
        if (!ehPlaceholder) {
            gradesFilterContainer.style.display = 'block'; 
            const filterLi = document.createElement('li');
            const filterCheckbox = document.createElement('input');
            filterCheckbox.type = 'checkbox';
            filterCheckbox.checked = true; 
            filterCheckbox.id = `filter-grade-${materia}`;
            filterCheckbox.setAttribute('data-materia-filtro', materia);
            const filterLabel = document.createElement('label');
            filterLabel.htmlFor = `filter-grade-${materia}`;
            filterLabel.textContent = materia;
            filterLi.appendChild(filterCheckbox);
            filterLi.appendChild(filterLabel);
            gradesFilterCheckboxes.appendChild(filterLi);

            filterCheckbox.addEventListener('change', (e) => {
                const materiaSelecionada = e.target.getAttribute('data-materia-filtro');
                const itemDaLista = document.querySelector(`#gradesList li[data-materia="${materiaSelecionada}"]`);
                if (itemDaLista) {
                    itemDaLista.style.display = e.target.checked ? 'flex' : 'none';
                }
            });
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
        inputNota.value = notasMap[materia] || 0; // Padrão 0
        inputNota.classList.add('grade-input'); 

        if (!podeEditarNotas(materia)) {
            inputNota.disabled = true;
        }

        inputNota.addEventListener('change', () => {
            let novoValor = parseFloat(inputNota.value);
            if (novoValor > 10) novoValor = 10;
            if (novoValor < 0 || isNaN(novoValor)) novoValor = 0;
            inputNota.value = novoValor;
            aluno.notas[materia] = novoValor;
            atualizarMedia(aluno); 
            salvarAtualizacoesAluno(aluno); 
        });

        itemLista.appendChild(rotuloMateria);
        itemLista.appendChild(inputNota);
        listaNotasElemento.appendChild(itemLista);
    }

    // --- Recria os inputs de FALTA (Com Filtro) ---
    const faltasMap = aluno.faltasPorMateria || {};
    const aulasMap = aluno.aulasTotaisPorMateria || {};

    for (let materia in materiasBase) { 
        
        const deveMostrarFalta = isCoordenador || (usuarioCargo === 'PROFESSOR' && materia === usuarioMateria);

        if (deveMostrarFalta) { 
            
            if (isCoordenador && !ehPlaceholder) {
                freqFilterContainer.style.display = 'block'; 
                const filterLi = document.createElement('li');
                const filterCheckbox = document.createElement('input');
                filterCheckbox.type = 'checkbox';
                filterCheckbox.checked = true; 
                filterCheckbox.id = `filter-freq-${materia}`;
                filterCheckbox.setAttribute('data-materia-filtro', materia);
                const filterLabel = document.createElement('label');
                filterLabel.htmlFor = `filter-freq-${materia}`;
                filterLabel.textContent = materia;
                filterLi.appendChild(filterCheckbox);
                filterLi.appendChild(filterLabel);
                freqFilterCheckboxes.appendChild(filterLi);

                filterCheckbox.addEventListener('change', (e) => {
                    const materiaSelecionada = e.target.getAttribute('data-materia-filtro');
                    const itemDaLista = document.querySelector(`#frequencyList li[data-materia="${materiaSelecionada}"]`);
                    if (itemDaLista) {
                        itemDaLista.style.display = e.target.checked ? 'flex' : 'none';
                    }
                });
            }

            const itemLista = document.createElement('li');
            itemLista.setAttribute('data-materia', materia); 

            const rotuloMateria = document.createElement('span');
            rotuloMateria.textContent = materia;
            const inputFalta = document.createElement('input');
            inputFalta.type = 'number';
            inputFalta.min = 0;
            const maxAulas = aulasMap[materia] || 50; 
            inputFalta.max = maxAulas;
            inputFalta.value = faltasMap[materia] || 0; // Padrão 0
            inputFalta.classList.add('grade-input'); 

            if (!podeEditarFaltas(materia)) {
                inputFalta.disabled = true;
            }

            inputFalta.addEventListener('change', () => {
                let novoValor = parseInt(inputFalta.value);
                if (novoValor > maxAulas) novoValor = maxAulas;
                if (novoValor < 0 || isNaN(novoValor)) novoValor = 0;
                inputFalta.value = novoValor;
                aluno.faltasPorMateria[materia] = novoValor;
                atualizarGraficoRosca(aluno.faltasPorMateria, aluno.aulasTotaisPorMateria); 
                salvarAtualizacoesAluno(aluno); 
            });

            itemLista.appendChild(rotuloMateria);
            itemLista.appendChild(inputFalta);
            listaFrequenciaElemento.appendChild(itemLista);
        }
    }

    // Popula campos gerais
    anotacoesElemento.textContent = aluno.anotacao || '';
    metasElemento.textContent = aluno.metas || '';
    feedbackElemento.textContent = aluno.feedback || '';
    alertaElemento.textContent = aluno.alerta || ''; 

    // Média e Barra
    mediaAlunoElemento.textContent = (aluno.media || 0).toFixed(2);
    mediaBarElemento.style.width = (aluno.media * 10) + '%';
    
    // Desativação geral (baseada em 'podeEditarCamposGerais')
    const inputsHistorico = document.querySelectorAll('.historical-input');
    inputsHistorico.forEach(input => input.disabled = !podeEditarCamposGerais);
    
    // Coordenador pode editar a turma, professor não.
    turmaInputElemento.disabled = !isCoordenador || ehPlaceholder;
    
    const editaveis = document.querySelectorAll('#studentName, #notes, #studentAlert, #studentGoals, #studentFeedback');
    editaveis.forEach(caixa => caixa.contentEditable = podeEditarCamposGerais);
}
// --- FIM DO RENDERIZAR ---


// --- Event Listeners ---
function handleHistoricalGradeChange(inputElement, trimestreIndex) {
    const aluno = listaDeAlunos[indiceAtual];
    if (!aluno || aluno.matricula === '????') return; 
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
        if (!alunoAtual || alunoAtual.matricula === '????') return;
        
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
addBlurSaveListener(turmaInputElemento, 'turma'); // Listener para o input de turma


document.getElementById('prev').addEventListener('click', () => {
    indiceAtual = (indiceAtual - 1 + listaDeAlunos.length) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});
document.getElementById('next').addEventListener('click', () => {
    indiceAtual = (indiceAtual + 1) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});

// Event listener do seletor de turma (dropdown) foi REMOVIDO

photoFrameElement.addEventListener('click', () => {
    const aluno = listaDeAlunos[indiceAtual];
    if (!aluno) return;
    if (aluno.matricula === '????') {
        handleCriarNovoAluno();
    } else {
        fileInputElement.click(); 
    }
});
fileInputElement.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return; 
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


// --- ATUALIZADO: Inicializa a aplicação ---
initApp();