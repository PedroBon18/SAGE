// Rótulos globais para o histórico (Três períodos)
const periodos = ['1º Trim.', '2º Trim.', '3º Trim.']; 

// --- LÓGICA DE API ---
let listaDeAlunos = []; 
let indiceAtual = 0;
const API_URL = '/api/alunos'; 

const alunoPlaceholder = {
    nome: 'Adicionar Aluno',
    matricula: '????',
    media: 0, 
    notas: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
    frequencia: { faltas: 0, totalAulas: 200 },
    anotacao: 'Use o hexágono central para adicionar um novo registro.',
    metas: 'Novo registro. Preencha os dados.',
    feedback: 'Nenhum feedback registrado.',
    alerta: 'Aguardando novo aluno.',
    classeFoto: 'AlunoPlaceholder',
    historicoMedia: [0, 0, 0],
    id: null,
    fotoBase64: null // Adicionado
};
// --------------------------


// Seletores de elementos
const nomeAlunoElemento = document.getElementById('studentName');
const matriculaAlunoElemento = document.getElementById('studentID');
const mediaAlunoElemento = document.getElementById('studentAverage');
const listaNotasElemento = document.getElementById('gradesList');
const anotacoesElemento = document.getElementById('notes');
const fotoElemento = document.getElementById('photo');
const mediaBarElemento = document.getElementById('studentAverageBar');
const faltasInputElemento = document.getElementById('studentAbsencesInput');
const metasElemento = document.getElementById('studentGoals');
const feedbackElemento = document.getElementById('studentFeedback');
const alertaElemento = document.getElementById('studentAlert');
const gradeTrim1Input = document.getElementById('gradeTrim1');
const gradeTrim2Input = document.getElementById('gradeTrim2');
const gradeTrim3Input = document.getElementById('gradeTrim3');
const rankElemento = document.getElementById('studentRank');

// --- NOVOS SELETORES PARA FOTO ---
const photoFrameElement = document.getElementById('photoFrame'); 
const fileInputElement = document.getElementById('fileInput'); 
// ----------------------------------

// Variáveis globais para os Gráficos
let radarChart;
let doughnutChart;
let lineChart; 
const radarCtx = document.getElementById('radarChart')?.getContext('2d');
const doughnutCtx = document.getElementById('doughnutChart')?.getContext('2d');
const lineCtx = document.getElementById('lineChart')?.getContext('2d'); 

// --- FUNÇÕES DE API ---

// Função para CRIAR um novo aluno
async function handleCriarNovoAluno() {
    console.log("Iniciando criação de novo aluno...");

    const novoAlunoPadrao = {
        nome: "Novo Aluno",
        matricula: `MAT-${Math.floor(Math.random() * 9000) + 1000}`, 
        media: 0,
        notas: { 'Matemática': 0, 'Português': 0, 'História': 0, 'Geografia': 0, 'Inglês': 0, 'Ciências': 0 },
        frequencia: { faltas: 0, totalAulas: 200 },
        anotacao: '',
        metas: '',
        feedback: '',
        alerta: '',
        classeFoto: 'Aluno1', // Foto padrão
        historicoMedia: [0, 0, 0],
        fotoBase64: null // Campo novo
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


// Função para salvar atualizações no back-end
async function salvarAtualizacoesAluno(aluno) {
    if (aluno.matricula === '????' || !aluno.id) {
        console.log("Alterações no placeholder não são salvas no back-end.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${aluno.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aluno), 
        });

        if (!response.ok) throw new Error('Falha ao salvar dados do aluno.');
        
        console.log(`Aluno ${aluno.nome} (ID: ${aluno.id}) salvo com sucesso!`);
        calcularRanking(); 
        rankElemento.textContent = `Rank ${aluno.rank}`;

    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}


// Função para carregar dados da API
async function carregarAlunosDaAPI() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro ao buscar dados da API');
        
        listaDeAlunos = await response.json(); 
        listaDeAlunos.push(alunoPlaceholder);

        if (listaDeAlunos.length > 0) {
            calcularRanking(); 
            inicializarGraficos();
            renderizarAluno(indiceAtual);
        } else {
            console.log('Nenhum aluno encontrado no banco de dados.');
        }

    } catch (error) {
        console.error('Falha ao carregar alunos:', error);
    }
}

// -------------------------------


// Função para calcular e atualizar o ranking de todos os alunos
function calcularRanking() {
    const alunosReais = listaDeAlunos.filter(a => a.matricula !== '????');
    const alunosOrdenados = [...alunosReais].sort((a, b) => b.media - a.media);
    alunosOrdenados.forEach((aluno, index) => {
        aluno.rank = index + 1;
    });
    const placeholder = listaDeAlunos.find(a => a.matricula === '????');
    if (placeholder) {
        placeholder.rank = 'N/A';
    }
}

// Configurações dos Gráficos (Sem alteração)
const radarConfig = {
    type: 'radar',
    data: {
        labels: [], 
        datasets: [{
            label: 'Notas',
            data: [], 
            backgroundColor: 'rgba(100, 255, 218, 0.2)',
            borderColor: '#64ffda',
            pointBackgroundColor: '#64ffda',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#64ffda',
            borderWidth: 2,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, 
        plugins: { legend: { display: false }, },
        scales: {
            r: {
                angleLines: { color: '#495c80' },
                grid: { color: '#495c80' },
                pointLabels: { color: '#ccd6f6', font: { size: 14 } },
                suggestedMin: 0,
                suggestedMax: 10,
                ticks: { backdropColor: '#112240', color: '#a8b2d1', stepSize: 2 }
            }
        }
    }
};

const doughnutConfig = {
    type: 'doughnut',
    data: {
        labels: ['Presença (%)', 'Faltas (%)'],
        datasets: [{
            data: [], 
            backgroundColor: [ '#64ffda', '#ff4d4d' ],
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, 
        plugins: { legend: { position: 'bottom', labels: { color: '#a8b2d1' } } },
        cutout: '80%',
    }
};

const lineConfig = {
    type: 'line',
    data: {
        labels: periodos,
        datasets: [{
            label: 'Média Geral',
            data: [], 
            borderColor: '#64ffda',
            backgroundColor: 'rgba(100, 255, 218, 0.1)',
            borderWidth: 2,
            tension: 0.4, 
            pointRadius: 6, 
            pointBackgroundColor: '#fff',
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Evolução da Média Geral', color: '#ccd6f6', font: { size: 16 } }
        },
        scales: {
            y: {
                min: 0,
                max: 10,
                ticks: { color: '#a8b2d1', stepSize: 2 },
                grid: { color: '#1e3c72' }
            },
            x: {
                ticks: { color: '#a8b2d1' },
                grid: { display: false }
            }
        }
    }
};


// Função para inicializar o Chart.js
function inicializarGraficos() {
    if (radarCtx) radarChart = new Chart(radarCtx, radarConfig);
    if (doughnutCtx) doughnutChart = new Chart(doughnutCtx, doughnutConfig);
    if (lineCtx) lineChart = new Chart(lineCtx, lineConfig);
}

// Funções para atualizar os Gráficos (Sem alteração)
function atualizarGraficoRadar(notas) {
    const labels = Object.keys(notas);
    const data = Object.values(notas);
    if (radarChart) {
        radarChart.data.labels = labels;
        radarChart.data.datasets[0].data = data;
        radarChart.update();
    }
}

function atualizarGraficoRosca(frequencia) {
    if (doughnutChart) {
        const { faltas, totalAulas } = frequencia;
        const total = Math.max(totalAulas, 1); 
        const percFaltas = (faltas / total) * 100;
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


// Função para atualizar a média
function atualizarMedia(aluno) {
    let somaDasNotas = 0;
    let quantidadeDeNotas = 0;
    for (let materia in aluno.notas) {
        somaDasNotas += aluno.notas[materia];
        quantidadeDeNotas++;
    }
    const mediaCalculada = (quantidadeDeNotas > 0) 
        ? Math.min(somaDasNotas / quantidadeDeNotas, 10).toFixed(2)
        : 0;
        
    aluno.media = parseFloat(mediaCalculada); 
    mediaAlunoElemento.textContent = mediaCalculada;
    mediaBarElemento.style.width = (mediaCalculada * 10) + '%';
    
    calcularRanking(); 
    rankElemento.textContent = `Rank ${aluno.rank}`;
    atualizarGraficoRadar(aluno.notas);
}

// Função para renderizar o aluno atual
function renderizarAluno(indice) {
    calcularRanking(); 
    const aluno = listaDeAlunos[indice];
    
    nomeAlunoElemento.textContent = aluno.nome;
    matriculaAlunoElemento.textContent = aluno.matricula;
    listaNotasElemento.innerHTML = ''; 
    rankElemento.textContent = `Rank ${aluno.rank}`;

    // --- LÓGICA DA FOTO ATUALIZADA ---
    fotoElemento.className = 'photo'; // Reseta as classes de foto
    fotoElemento.style.backgroundImage = ''; // Limpa o style inline
    photoFrameElement.classList.remove('clickable'); // Reseta o clique

    if (aluno.fotoBase64) {
        // Se tem foto Base64, usa ela
        fotoElemento.style.backgroundImage = `url(${aluno.fotoBase64})`;
        photoFrameElement.classList.add('clickable'); // Pode ser clicado para mudar
    } else if (aluno.classeFoto) {
        // Se não, usa a classe (Aluno1, AlunoPlaceholder, etc)
        fotoElemento.classList.add(aluno.classeFoto);
        // Só é clicável se NÃO for o placeholder
        if (aluno.matricula !== '????') {
            photoFrameElement.classList.add('clickable');
        }
    }
    // --- FIM DA LÓGICA DA FOTO ---

    // Atualiza Gráficos
    atualizarGraficoRadar(aluno.notas); 
    atualizarGraficoRosca(aluno.frequencia);
    atualizarGraficoLinha(aluno.historicoMedia || [0, 0, 0]); 

    // Popula os inputs de Trimestre
    const [t1, t2, t3] = aluno.historicoMedia || [0, 0, 0]; 
    gradeTrim1Input.value = t1 !== undefined ? t1 : '';
    gradeTrim2Input.value = t2 !== undefined ? t2 : '';
    gradeTrim3Input.value = t3 !== undefined ? t3 : '';
    
    // Atualiza input de faltas
    faltasInputElemento.value = aluno.frequencia.faltas;
    faltasInputElemento.max = aluno.frequencia.totalAulas;

    // Recria os inputs de nota
    for (let materia in aluno.notas) {
        const itemLista = document.createElement('li');
        const rotuloMateria = document.createElement('span');
        rotuloMateria.textContent = materia;

        const inputNota = document.createElement('input');
        inputNota.type = 'number';
        inputNota.min = 0;
        inputNota.max = 10;
        inputNota.step = 0.1;
        inputNota.value = aluno.notas[materia];
        inputNota.classList.add('grade-input'); 

        inputNota.addEventListener('change', () => {
            let novoValor = parseFloat(inputNota.value);
            if (novoValor > 10) novoValor = 10;
            if (novoValor < 0) novoValor = 0;
            inputNota.value = novoValor;
            
            aluno.notas[materia] = novoValor;
            atualizarMedia(aluno); 
            salvarAtualizacoesAluno(aluno); 
        });

        itemLista.appendChild(rotuloMateria);
        itemLista.appendChild(inputNota);
        listaNotasElemento.appendChild(itemLista);
    }

    // Popula os novos campos
    anotacoesElemento.textContent = aluno.anotacao || '';
    metasElemento.textContent = aluno.metas || '';
    feedbackElemento.textContent = aluno.feedback || '';
    alertaElemento.textContent = aluno.alerta || ''; 

    // Exibe a média e a barra
    mediaAlunoElemento.textContent = (aluno.media || 0).toFixed(2);
    mediaBarElemento.style.width = (aluno.media * 10) + '%';
    
    // Habilita/Desabilita inputs se for o placeholder
    const ehPlaceholder = aluno.matricula === '????';
    const inputs = document.querySelectorAll('.grade-input, .historical-input, #studentAbsencesInput');
    inputs.forEach(input => input.disabled = ehPlaceholder);
    
    // Habilita/Desabilita caixas de texto
    const editaveis = document.querySelectorAll('#studentName, #notes, #studentAlert, #studentGoals, #studentFeedback');
    editaveis.forEach(caixa => caixa.contentEditable = !ehPlaceholder);
}

// --- Event Listeners para Conteúdo Editável ---

function handleHistoricalGradeChange(inputElement, trimestreIndex) {
    const aluno = listaDeAlunos[indiceAtual];
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


nomeAlunoElemento.addEventListener('blur', () => {
    let novoNome = nomeAlunoElemento.textContent.trim();
    const alunoAtual = listaDeAlunos[indiceAtual];
    if (novoNome && novoNome !== alunoAtual.nome) {
        alunoAtual.nome = novoNome;
        salvarAtualizacoesAluno(alunoAtual); 
    } else {
        nomeAlunoElemento.textContent = alunoAtual.nome; 
    }
});
nomeAlunoElemento.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }});

anotacoesElemento.addEventListener('blur', () => {
    const alunoAtual = listaDeAlunos[indiceAtual];
    let novoTexto = anotacoesElemento.textContent.trim();
    if (novoTexto !== alunoAtual.anotacao) {
        alunoAtual.anotacao = novoTexto;
        salvarAtualizacoesAluno(alunoAtual); 
    }
});
anotacoesElemento.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }});

alertaElemento.addEventListener('blur', () => {
    const alunoAtual = listaDeAlunos[indiceAtual];
    let novoTexto = alertaElemento.textContent.trim();
    if (novoTexto !== alunoAtual.alerta) {
        alunoAtual.alerta = novoTexto;
        salvarAtualizacoesAluno(alunoAtual); 
    }
});
alertaElemento.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }});

metasElemento.addEventListener('blur', () => {
    const alunoAtual = listaDeAlunos[indiceAtual];
    let novoTexto = metasElemento.textContent.trim();
    if (novoTexto !== alunoAtual.metas) {
        alunoAtual.metas = novoTexto;
        salvarAtualizacoesAluno(alunoAtual); 
    }
});
metasElemento.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }});

feedbackElemento.addEventListener('blur', () => {
    const alunoAtual = listaDeAlunos[indiceAtual];
    let novoTexto = feedbackElemento.textContent.trim();
    if (novoTexto !== alunoAtual.feedback) {
        alunoAtual.feedback = novoTexto;
        salvarAtualizacoesAluno(alunoAtual); 
    }
});
feedbackElemento.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }});

// Botões de navegação
document.getElementById('prev').addEventListener('click', () => {
    indiceAtual = (indiceAtual - 1 + listaDeAlunos.length) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});

document.getElementById('next').addEventListener('click', () => {
    indiceAtual = (indiceAtual + 1) % listaDeAlunos.length;
    renderizarAluno(indiceAtual);
});

// Event Listener para o input de FALTAS
faltasInputElemento.addEventListener('change', () => {
    const alunoAtual = listaDeAlunos[indiceAtual];
    let novoNumFaltas = parseInt(faltasInputElemento.value);

    if (novoNumFaltas < 0) novoNumFaltas = 0;
    if (novoNumFaltas > alunoAtual.frequencia.totalAulas) {
        novoNumFaltas = alunoAtual.frequencia.totalAulas;
    }
    
    faltasInputElemento.value = novoNumFaltas;
    
    if (alunoAtual.frequencia.faltas !== novoNumFaltas) {
        alunoAtual.frequencia.faltas = novoNumFaltas;
        atualizarGraficoRosca(alunoAtual.frequencia);
        salvarAtualizacoesAluno(alunoAtual); 
    }
});

// EVENT LISTENERS PARA UPLOAD DE FOTO

// 1. Clicar no frame da foto (para upload) ou no placeholder (para criar)
photoFrameElement.addEventListener('click', () => {
    const aluno = listaDeAlunos[indiceAtual];
    if (!aluno) return;

    if (aluno.matricula === '????') {
        // Se é o placeholder, cria um novo aluno
        handleCriarNovoAluno();
    } else {
        // Se é um aluno real, abre a seleção de arquivo
        fileInputElement.click(); 
    }
});

// 2. Quando um arquivo é selecionado
fileInputElement.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return; // Sai se o usuário cancelou

    const reader = new FileReader();

    // 3. Quando o arquivo for lido
    reader.onload = (e) => {
        const base64String = e.target.result;
        
        // 4. Atualiza o objeto do aluno
        const alunoAtual = listaDeAlunos[indiceAtual];
        alunoAtual.fotoBase64 = base64String;
        
        // 5. Atualiza a visualização da foto imediatamente
        fotoElemento.style.backgroundImage = `url(${base64String})`;
        
        // 6. Salva a mudança no back-end
        salvarAtualizacoesAluno(alunoAtual);

        // Limpa o input para poder selecionar o mesmo arquivo novamente
        fileInputElement.value = null;
    };

    // 7. Lê o arquivo como Data URL (Base64)
    reader.readAsDataURL(file);
});


// Inicializa a aplicação
carregarAlunosDaAPI();