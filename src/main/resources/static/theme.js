// Este script deve ser carregado no <head> das suas páginas
// para evitar o "flash" do tema padrão antes do tema salvo ser aplicado.

(function() {
    const htmlElement = document.documentElement; // A tag <html>

    /**
     * Aplica o tema ao documento e salva no localStorage.
     * @param {string} theme - O nome do tema (ex: "sage", "light", "matrix")
     */
    function applyTheme(theme) {
        htmlElement.dataset.theme = theme; // Aplica o atributo ex: <html data-theme="light">
        localStorage.setItem('sage-theme', theme); // Salva a escolha
    }

    /**
     * Carrega o tema salvo do localStorage.
     * Se nenhum for salvo, usa "sage" como padrão.
     */
    function loadInitialTheme() {
        const savedTheme = localStorage.getItem('sage-theme') || 'sage'; // 'sage' é o padrão
        applyTheme(savedTheme);
    }

    // --- Execução Imediata ---
    // Carrega o tema salvo IMEDIATAMENTE quando este script é lido (no <head>).
    // Isto é crucial para evitar o "flash" do tema errado.
    loadInitialTheme();

    // --- Adicionar Listeners após o DOM carregar ---
    // O resto do script espera a página carregar para anexar o listener ao dropdown.
    document.addEventListener('DOMContentLoaded', () => {
        
        // Procura o dropdown em qualquer página
        const themeSwitcher = document.getElementById('theme-switcher'); 
        
        if (themeSwitcher) {
            // Define o valor do dropdown para o tema que está carregado
            const currentTheme = localStorage.getItem('sage-theme') || 'sage';
            themeSwitcher.value = currentTheme;

            // Adiciona o listener de mudança
            themeSwitcher.addEventListener('change', (e) => {
                applyTheme(e.target.value);
            });
        }
    });

})();