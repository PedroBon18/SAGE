// Rótulos globais para o histórico (Três períodos)
const periodos = ['1º Trim.', '2º Trim.', '3º Trim.']; 

// --- LÓGICA DE API ---
let listaDeAlunos = []; 
let indiceAtual = 0;
const API_URL = '/api/alunos'; 

// --- ATUALIZADO: Variáveis globais para guardar info do usuário ---
let usuarioCargo = null;  // Ex: "PROFESSOR" ou "COORDENADOR"
let usuarioMateria = null; // Ex: "Matemática" (ou null se for Coordenador)
// ----------------------------------------------------------------

const alunoPlaceholder = {
    nome: 'Adicionar Aluno',
    matricula: '????',
    media: 0, 
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
    instituicao: null // Adicionado para consistência do modelo
};
// --------------------------


// Seletores de elementos (sem alteração)
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

// Variáveis globais para os Gráficos (sem alteração)
let radarChart;
let doughnutChart;
let lineChart; 
const radarCtx = document.getElementById('radarChart')?.getContext('2d');
const doughnutCtx = document.getElementById('doughnutChart')?.getContext('2d');
const lineCtx = document.getElementById('lineChart')?.getContext('2d'); 

// --- FUNÇÕES DE API ---

// ATUALIZADO: Busca os dados (Cargo e Matéria) do usuário logado
async function buscarDadosUsuario() {
    try {
        // 1. MUDANÇA: O endpoint agora é /info
        const response = await fetch('/api/usuario/info'); 
        
        if (response.status === 401) {
            // Se não estiver logado, vai para a página de login
            window.location.href = '/login.html'; // Garante que é .html
            return;
        }
        
        if (!response.ok) {
            throw new Error('Falha ao buscar dados do usuário.');
        }

        const dados = await response.json(); // Espera { "cargo": "...", "materia": "..." }
        
        // 2. MUDANÇA: Armazena o cargo e a matéria
        usuarioCargo = dados.cargo ? dados.cargo.toUpperCase() : null; // Garante "PROFESSOR" ou "COORDENADOR"
        usuarioMateria = dados.materia; 
        
        console.log(`Usuário logado. Cargo: ${usuarioCargo}, Matéria: ${usuarioMateria || 'N/A'}`);

        // 3. Carrega os alunos (agora a API de alunos vai filtrar pela instituição)
        carregarAlunosDaAPI();

    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
    }
}

// ATUALIZADO: Função para CRIAR um novo aluno
async function handleCriarNovoAluno() {
    console.log("Iniciando criação de novo aluno...");

    // Nota: Não precisamos de enviar a 'instituicao' aqui.
    // O AlunoController no Back-end já define a instituição
    // com base no usuário que está a fazer o pedido.
    const novoAlunoPadrao = {
        nome: "Novo Aluno",
        matricula: `MAT-${Math.floor(Math.random() * 9000) + 1000}`, 
        media: 0,
        notas: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
        faltasPorMateria: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
        aulasTotaisPorMateria: { 'Matemática': 50, 'Português': 50, 'História': 40, 'Geografia': 40, 'Inglês': 30, 'Ciências': 40 },
        anotacao: '',
        metas: '',
        feedback: '',
        alerta: '',
        classeFoto: 'DefaultProfile', 
        historicoMedia: [0, 0, 0],
        fotoBase64: null
        // 'instituicao' é definida no Back-end
    };

    try {
        const response = await fetch(API_URL, {
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


// Função para salvar atualizações no back-end (sem alteração)
async function salvarAtualizacoesAluno(aluno) {
    if (aluno.matricula === '????' || !aluno.id) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/${aluno.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aluno), 
        });
        if (!response.ok) {
             // Se o back-end retornar 403 (Proibido), exibe um alerta
            if(response.status === 403) {
                alert("Erro: Não tem permissão para editar este aluno.");
            }
            throw new Error('Falha ao salvar dados do aluno.');
        }
        console.log(`Aluno ${aluno.nome} (ID: ${aluno.id}) salvo com sucesso!`);
        calcularRanking(); 
        rankElemento.textContent = `Rank ${aluno.rank}`;
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}


// Função para carregar dados da API (sem alteração)
async function carregarAlunosDaAPI() {
    try {
        const response = await fetch(API_URL); // Esta API agora é filtrada pelo back-end
        if (!response.ok) throw new Error('Erro ao buscar dados da API');
        
        listaDeAlunos = await response.json(); 
        
        // Se a lista estiver vazia (nenhum aluno na instituição), adiciona o placeholder
        // Se houver alunos, o placeholder é adicionado no final
        if(listaDeAlunos.length === 0) {
            console.log('Nenhum aluno encontrado para esta instituição. Exibindo placeholder.');
        }
        listaDeAlunos.push(alunoPlaceholder);
        
        // Define o índice inicial
        indiceAtual = 0; 
        
        calcularRanking(); 
        inicializarGraficos();
        renderizarAluno(indiceAtual);

    } catch (error) {
        console.error('Falha ao carregar alunos:', error);
    }
}

// -------------------------------


// Função para calcular o ranking (sem alteração)
function calcularRanking() {
    const alunosReais = listaDeAlunos.filter(a => a.matricula !== '????');
    const alunosOrdenados = [...alunosReais].sort((a, b) => b.media - a.media);
    alunosOrdenados.forEach((aluno, index) => {
        aluno.rank = index + 1;
    });
    const placeholder = listaDeAlunos.find(a => a.matricula === '????');
    if (placeholder) placeholder.rank = 'N/A';
}

// Configurações dos Gráficos (sem alteração)
const radarConfig = {
    type: 'radar',
    data: { labels: [], datasets: [{ label: 'Notas', data: [], backgroundColor: 'rgba(100, 255, 218, 0.2)', borderColor: '#64ffda', pointBackgroundColor: '#64ffda', pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: '#64ffda', borderWidth: 2, fill: true }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, }, scales: { r: { angleLines: { color: '#495c80' }, grid: { color: '#495c80' }, pointLabels: { color: '#ccd6f6', font: { size: 14 } }, suggestedMin: 0, suggestedMax: 10, ticks: { backdropColor: '#112240', color: '#a8b2d1', stepSize: 2 } } } }
};
const doughnutConfig = {
    type: 'doughnut',
    data: { labels: ['Presença (%)', 'Faltas (%)'], datasets: [{ data: [], backgroundColor: [ '#64ffda', '#ff4d4d' ], hoverOffset: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a8b2d1' } } }, cutout: '80%', }
};
const lineConfig = {
    type: 'line',
    data: { labels: periodos, datasets: [{ label: 'Média Geral', data: [], borderColor: '#64ffda', backgroundColor: 'rgba(100, 255, 218, 0.1)', borderWidth: 2, tension: 0.4, pointRadius: 6, pointBackgroundColor: '#fff', fill: true }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: 'Evolução da Média Geral', color: '#ccd6f6', font: { size: 16 } } }, scales: { y: { min: 0, max: 10, ticks: { color: '#a8b2d1', stepSize: 2 }, grid: { color: '#1e3c72' } }, x: { ticks: { color: '#a8b2d1' }, grid: { display: false } } } }
};

// Funções de inicializar e atualizar gráficos (sem alteração)
function inicializarGraficos() {
    if (radarCtx && !radarChart) radarChart = new Chart(radarCtx, radarConfig);
    if (doughnutCtx && !doughnutChart) doughnutChart = new Chart(doughnutCtx, doughnutConfig);
    if (lineCtx && !lineChart) lineChart = new Chart(lineCtx, lineConfig);
}
function atualizarGraficoRadar(notas) {
    if (radarChart) {
        radarChart.data.labels = Object.keys(notas);
        radarChart.data.datasets[0].data = Object.values(notas);
        radarChart.update();
    }
}
function atualizarGraficoRosca(faltasPorMateria, aulasTotaisPorMateria) {
    if (doughnutChart) {
        let totalFaltas = 0, totalAulas = 0;
        if (faltasPorMateria) totalFaltas = Object.values(faltasPorMateria).reduce((soma, faltas) => soma + (faltas || 0), 0);
        if (aulasTotaisPorMateria) totalAulas = Object.values(aulasTotaisPorMateria).reduce((soma, aulas) => soma + (aulas || 0), 0);
        const total = Math.max(totalAulas, 1); 
        const percFaltas = (totalFaltas / total) * 100;
        const percPresente = 100 - percFaltas;
        doughnutChart.data.datasets[0].data = [percPresente.toFixed(2), percFaltas.toFixed(2)];
        doughnutChart.update();
    }
}
function atualizarGraficoLinha(historicoMedia) {
    if (lineChart) {
        lineChart.data.datasets[0].data = historicoMedia;
        lineChart.update();
    }
}
function atualizarMedia(aluno) {
    let soma = 0, quant = 0;
    const notas = aluno.notas || {};
    for (let mat in notas) { soma += notas[mat]; quant++; }
    const media = (quant > 0) ? Math.min(soma / quant, 10).toFixed(2) : 0;
    aluno.media = parseFloat(media); 
    mediaAlunoElemento.textContent = media;
    mediaBarElemento.style.width = (media * 10) + '%';
    calcularRanking(); 
    rankElemento.textContent = `Rank ${aluno.rank}`;
    atualizarGraficoRadar(aluno.notas);
}

// --- ATUALIZADO: Função principal de renderização ---
function renderizarAluno(indice) {
    calcularRanking(); 
    const aluno = listaDeAlunos[indice];
    const ehPlaceholder = aluno.matricula === '????';

    nomeAlunoElemento.textContent = aluno.nome;
    matriculaAlunoElemento.textContent = aluno.matricula;
    listaNotasElemento.innerHTML = ''; 
    listaFrequenciaElemento.innerHTML = ''; 
    rankElemento.textContent = `Rank ${aluno.rank}`;

    // Lógica da Foto (sem alteração)
    fotoElemento.className = 'photo'; 
    fotoElemento.style.backgroundImage = ''; 
    photoFrameElement.classList.add('clickable'); 
    if (aluno.fotoBase64) fotoElemento.style.backgroundImage = `url(${aluno.fotoBase64})`;
    else if (aluno.classeFoto) fotoElemento.classList.add(aluno.classeFoto);

    // Gráficos
    // Garante que os gráficos não quebrem se o aluno (placeholder) não tiver os dados
    atualizarGraficoRadar(aluno.notas || {}); 
    atualizarGraficoRosca(aluno.faltasPorMateria || {}, aluno.aulasTotaisPorMateria || {}); 
    atualizarGraficoLinha(aluno.historicoMedia || [0, 0, 0]); 

    // Popula Trimestre (sem alteração)
    const [t1, t2, t3] = aluno.historicoMedia || [0, 0, 0]; 
    gradeTrim1Input.value = t1 !== undefined ? t1 : '';
    gradeTrim2Input.value = t2 !== undefined ? t2 : '';
    gradeTrim3Input.value = t3 !== undefined ? t3 : '';

    // --- LÓGICA DE PERMISSÃO ATUALIZADA (BASEADA EM CARGO) ---
    const isCoordenador = usuarioCargo === 'COORDENADOR';
    
    // Coordenador pode editar tudo. Professor pode editar (inclusive campos gerais). Ninguém edita o placeholder.
    const podeEditarCamposGerais = !ehPlaceholder && (isCoordenador || usuarioCargo === 'PROFESSOR');
    const podeEditarNotas = (materia) => !ehPlaceholder && (isCoordenador || (usuarioCargo === 'PROFESSOR' && materia === usuarioMateria));
    const podeEditarFaltas = (materia) => !ehPlaceholder && (isCoordenador || (usuarioCargo === 'PROFESSOR' && materia === usuarioMateria));
    // -----------------------------------------------------------

    // Recria os inputs de NOTA (Mostra todos)
    const notasMap = aluno.notas || {};
    for (let materia in notasMap) {
        const itemLista = document.createElement('li');
        const rotuloMateria = document.createElement('span');
        rotuloMateria.textContent = materia;

        const inputNota = document.createElement('input');
        inputNota.type = 'number';
        inputNota.min = 0;
        inputNota.max = 10;
        inputNota.step = 0.1;
        inputNota.value = notasMap[materia];
        inputNota.classList.add('grade-input'); 

        // Desativa se não puder editar
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

    // --- ATUALIZADO: Recria os inputs de FALTA ---
    // Professor: Vê apenas a sua matéria.
    // Coordenador: Vê todas as matérias.
    // ---------------------------------------------
    const faltasMap = aluno.faltasPorMateria || {};
    const aulasMap = aluno.aulasTotaisPorMateria || {};
    const materiasBase = aluno.notas || {}; // Usa as notas como base para as matérias

    for (let materia in materiasBase) { 
        
        // Se for Coordenador, mostra. Se for Professor, só mostra se for a sua matéria.
        const deveMostrarFalta = isCoordenador || (usuarioCargo === 'PROFESSOR' && materia === usuarioMateria);

        if (faltasMap.hasOwnProperty(materia) && deveMostrarFalta) { 
            const itemLista = document.createElement('li');
            const rotuloMateria = document.createElement('span');
            rotuloMateria.textContent = materia;

            const inputFalta = document.createElement('input');
            inputFalta.type = 'number';
            inputFalta.min = 0;
            const maxAulas = aulasMap[materia] || 50; 
            inputFalta.max = maxAulas;
            inputFalta.value = faltasMap[materia];
            inputFalta.classList.add('grade-input'); 

            // Desativa se não puder editar (regra já inclui o placeholder)
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
    // --- FIM DA ATUALIZAÇÃO DE FALTAS ---

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
    
    const editaveis = document.querySelectorAll('#studentName, #notes, #studentAlert, #studentGoals, #studentFeedback');
    editaveis.forEach(caixa => caixa.contentEditable = podeEditarCamposGerais);
}
// --- FIM DO RENDERIZAR ---


// --- Event Listeners (Sem alteração) ---
function handleHistoricalGradeChange(inputElement, trimestreIndex) {
    const aluno = listaDeAlunos[indiceAtual];
    if (!aluno || aluno.matricula === '????') return; // Segurança extra
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
        let novoTexto = element.textContent.trim();
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


document.getElementById('prev').addEventListener('click', () => {
    indiceAtual = (indiceAtual - 1 + listaDeAlunos.length) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});
document.getElementById('next').addEventListener('click', () => {
    indiceAtual = (indiceAtual + 1) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});

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


// --- Inicializa a aplicação ---
// Chama a nova função que busca o Cargo antes de carregar os alunos
buscarDadosUsuario();