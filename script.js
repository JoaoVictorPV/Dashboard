document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const journalSelector = document.getElementById('journal-selector');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const authorInput = document.getElementById('author');
    const keywordsInput = document.getElementById('keywords');
    const maxResultsSelect = document.getElementById('max-results');
    const searchButton = document.getElementById('search-button');
    const resultsTableBody = document.querySelector('#results-table tbody');
    const resultsTable = document.getElementById('results-table');
    const loadingDiv = document.getElementById('loading');
    const resultsInfo = document.getElementById('results-info');
    const totalCount = document.getElementById('total-count');
    const tableControls = document.getElementById('table-controls');
    const searchFilter = document.getElementById('search-filter');
    const columnFilter = document.getElementById('column-filter');
    const clearFiltersButton = document.getElementById('clear-filters');
    
    // Botões de exportação
    const exportHtmlButton = document.getElementById('export-html-button');
    const exportJsonButton = document.getElementById('export-json-button');
    const exportCsvButton = document.getElementById('export-csv-button');
    
    // Botões de data
    const last6MonthsButton = document.getElementById('last-6-months');
    const last1YearButton = document.getElementById('last-1-year');
    const last18MonthsButton = document.getElementById('last-18-months');
    const last2YearsButton = document.getElementById('last-2-years');
    
    // Botões de faixas de anos
    const range2022_2024Button = document.getElementById('range-2022-2024');
    const range2019_2021Button = document.getElementById('range-2019-2021');
    const range2016_2018Button = document.getElementById('range-2016-2018');
    const range2013_2015Button = document.getElementById('range-2013-2015');
    const range2010_2012Button = document.getElementById('range-2010-2012');

    // Variáveis globais
    let currentResults = [];
    let filteredResults = [];
    let sortColumn = '';
    let sortDirection = 'asc';

    // Função para popular o seletor de revistas
    function populateJournalSelector(journals) {
        journals.forEach(journal => {
            const option = document.createElement('option');
            option.value = journal.id;
            option.textContent = journal.name;
            journalSelector.appendChild(option);
        });
    }

    // Lista de revistas incorporada diretamente com nomes oficiais do NLM para buscas precisas
    const journals = [
        { "id": "Seminars in musculoskeletal radiology", "name": "Seminars in Musculoskeletal Radiology" },
        { "id": "Insights into imaging", "name": "Insights Into Imaging" },
        { "id": "The British journal of radiology", "name": "British Journal of Radiology" },
        { "id": "World journal of radiology", "name": "World Journal of Radiology" },
        { "id": "Japanese journal of radiology", "name": "Japanese Journal of Radiology" },
        { "id": "Open journal of radiology", "name": "Open Journal of Radiology" },
        { "id": "Radiologic clinics of North America", "name": "Radiologic Clinics of North America" },
        { "id": "Magnetic resonance in medicine", "name": "Magnetic Resonance in Medicine" },
        { "id": "Canadian Association of Radiologists journal", "name": "Canadian Association of Radiologists Journal" },
        { "id": "Radiology", "name": "Radiology" },
        { "id": "European radiology", "name": "European Radiology" },
        { "id": "American journal of roentgenology", "name": "AJR" },
        { "id": "Journal of magnetic resonance imaging", "name": "JMRI" },
        { "id": "Investigative radiology", "name": "Investigative Radiology" },
        { "id": "Radiologia brasileira", "name": "Radiologia Brasileira" },
        { "id": "Clinical radiology", "name": "Clinical Radiology" },
        { "id": "Journal of medical Internet research", "name": "JMIRao (J Med Internet Res)" },
        { "id": "Korean journal of radiology", "name": "Korean Journal of Radiology" },
        { "id": "The Indian journal of radiology and imaging", "name": "Indian Journal of Radiology and Imaging" },
        { "id": "The Journal of bone and joint surgery. American volume", "name": "JBJS American" },
        { "id": "The bone and joint journal", "name": "BJJ" },
        { "id": "Clinical orthopaedics and related research", "name": "CORR" },
        { "id": "Acta orthopaedica", "name": "Acta Orthopaedica" },
        { "id": "Journal of orthopaedic research", "name": "JOR" },
        { "id": "International orthopaedics", "name": "International Orthopaedics" },
        { "id": "Revista brasileira de ortopedia", "name": "RBO" },
        { "id": "Journal of orthopaedic science", "name": "Journal of Orthopaedic Science" },
        { "id": "Indian journal of orthopaedics", "name": "Indian Journal of Orthopaedics" },
        { "id": "Orthopaedics and traumatology, surgery and research", "name": "OTSR" },
        { "id": "Journal of shoulder and elbow surgery", "name": "JSES" },
        { "id": "Shoulder and elbow", "name": "Shoulder & Elbow" },
        { "id": "JSES international", "name": "JSES International" },
        { "id": "Journal of orthopaedic surgery and research", "name": "Journal of Orthopaedic Surgery and Research" },
        { "id": "Journal of shoulder and elbow surgery", "name": "Journal of Elbow Surgery" },
        { "id": "The journal of wrist surgery", "name": "Journal of Wrist Surgery" },
        { "id": "Hand surgery and rehabilitation", "name": "Hand Surgery and Rehabilitation" },
        { "id": "The Journal of hand surgery", "name": "Journal of Hand Surgery American" },
        { "id": "The Journal of hand surgery. European volume", "name": "Journal of Hand Surgery European" },
        { "id": "Journal of hip preservation surgery", "name": "Journal of Hip Preservation Surgery" },
        { "id": "Hip international", "name": "Hip International" },
        { "id": "Knee surgery, sports traumatology, arthroscopy", "name": "KSSTA" },
        { "id": "The knee", "name": "The Knee" },
        { "id": "Foot and ankle international", "name": "Foot & Ankle International" },
        { "id": "Foot and ankle surgery", "name": "Foot and Ankle Surgery" },
        { "id": "The foot", "name": "The Foot" },
        { "id": "Foot and ankle orthopaedics", "name": "Foot & Ankle Orthopaedics" },
        { "id": "Radiographics", "name": "Radiographics" },
        { "id": "Skeletal radiology", "name": "Skeletal Radiology" }
    ];
    populateJournalSelector(journals);

    // Função para mostrar loading
    function showLoading() {
        loadingDiv.style.display = 'block';
        resultsInfo.style.display = 'none';
        tableControls.style.display = 'none';
        resultsTable.style.display = 'none';
    }

    // Função para esconder loading
    function hideLoading() {
        loadingDiv.style.display = 'none';
    }

    // Função para mostrar resultados
    function showResults(results) {
        currentResults = results;
        filteredResults = [...results];
        
        updateResultsInfo();
        resultsInfo.style.display = 'block';
        tableControls.style.display = 'block';
        resultsTable.style.display = 'table';
        
        renderTable(filteredResults);
    }

    // Função para atualizar informações dos resultados
    function updateResultsInfo() {
        totalCount.textContent = currentResults.length;
    }

    // Função para formatar data
    function formatDate(dateString) {
        if (!dateString || dateString === 'N/A') return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    }

    // Função para renderizar a tabela
    function renderTable(results) {
        resultsTableBody.innerHTML = '';
        
        results.forEach(article => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td class="col-date">${formatDate(article['DATA DE PUBLICACAO'])}</td>
                <td class="col-title" title="${article['TITULO DA PUBLICACAO']}">${article['TITULO DA PUBLICACAO']}</td>
                <td class="col-journal" title="${article['REVISTA']}">${article['REVISTA']}</td>
                <td class="col-authors" title="${article['AUTORES']}">${article['AUTORES']}</td>
                <td class="col-link">
                    ${article['LINK CANONICO'] ? `<a href="${article['LINK CANONICO']}" target="_blank">🔗</a>` : '-'}
                </td>
                <td class="col-access ${article['OPEN ACESS'] === 'Sim' ? 'open-access-yes' : 'open-access-no'}">
                    ${article['OPEN ACESS'] || 'N/A'}
                </td>
            `;
            
            resultsTableBody.appendChild(row);
        });
    }

    // Função principal de busca no PubMed
    async function searchPubMed() {
        const selectedJournals = Array.from(journalSelector.selectedOptions).map(option => `"${option.value}"[Journal]`);
        const startDate = startDateInput.value.replace(/-/g, '/');
        const endDate = endDateInput.value.replace(/-/g, '/');
        const author = authorInput.value ? `"${authorInput.value}"[Author]` : '';
        const keywords = keywordsInput.value.split(',').map(k => k.trim()).filter(k => k).map(k => `"${k}"[Title/Abstract]`);
        const maxResults = parseInt(maxResultsSelect.value);

        let term = [];
        if (keywords.length > 0) term.push(keywords.join(' AND '));
        if (author) term.push(author);
        if (selectedJournals.length > 0) term.push(`(${selectedJournals.join(' OR ')})`);
        if (startDate && endDate) {
            term.push(`("${startDate}":"${endDate}"[Date - Publication])`);
        }

        if (term.length === 0) {
            alert('Por favor, preencha pelo menos um campo de busca.');
            return;
        }

        const searchTerm = term.join(' AND ');
        
        showLoading();

        try {
            // Etapa 1: ESearch para obter os IDs
            const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerm)}&retmode=json&sort=relevance&retmax=${maxResults}`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            
            const idList = searchData.esearchresult.idlist;

            if (!idList || idList.length === 0) {
                hideLoading();
                alert('Nenhum resultado encontrado.');
                showResults([]);
                return;
            }

            const ids = idList.join(',');

            // Etapa 2: ESummary para obter os detalhes dos artigos
            const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
            const summaryResponse = await fetch(summaryUrl);
            const summaryData = await summaryResponse.json();

            // Etapa 3: Mapear e exibir os resultados
            const articles = summaryData.result;
            const results = Object.keys(articles).filter(key => key !== 'uids').map(uid => {
                const article = articles[uid];
                return {
                    'DATA DE PUBLICACAO': article.pubdate,
                    'TITULO DA PUBLICACAO': article.title,
                    'REVISTA': article.source,
                    'AUTORES': article.authors.map(a => a.name).join(', '),
                    'LINK CANONICO': `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
                    'OPEN ACESS': 'N/A' // A API ESummary não fornece essa informação diretamente
                };
            });

            hideLoading();
            showResults(results);

        } catch (error) {
            hideLoading();
            console.error('Erro na busca do PubMed:', error);
            alert('Ocorreu um erro ao buscar os dados no PubMed.');
        }
    }

    // Função de filtro
    function applyFilters() {
        const searchTerm = searchFilter.value.toLowerCase();
        const columnToFilter = columnFilter.value;
        
        filteredResults = currentResults.filter(article => {
            if (!searchTerm) return true;
            
            if (columnToFilter) {
                const value = article[columnToFilter] || '';
                return value.toString().toLowerCase().includes(searchTerm);
            } else {
                return Object.values(article).some(value => 
                    value.toString().toLowerCase().includes(searchTerm)
                );
            }
        });
        
        renderTable(filteredResults);
        totalCount.textContent = filteredResults.length;
    }

    // Função de ordenação
    function sortTable(column) {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }
        
        filteredResults.sort((a, b) => {
            let aVal = a[column] || '';
            let bVal = b[column] || '';
            
            if (column === 'DATA DE PUBLICACAO') {
                aVal = new Date(aVal.split('/').reverse().join('-'));
                bVal = new Date(bVal.split('/').reverse().join('-'));
            } else {
                aVal = aVal.toString().toLowerCase();
                bVal = bVal.toString().toLowerCase();
            }
            
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        
        renderTable(filteredResults);
        updateSortArrows();
    }

    // Atualizar setas de ordenação
    function updateSortArrows() {
        document.querySelectorAll('.sort-arrow').forEach(arrow => {
            arrow.textContent = '';
        });
        
        const activeHeader = document.querySelector(`th[data-column="${sortColumn}"] .sort-arrow`);
        if (activeHeader) {
            activeHeader.textContent = sortDirection === 'asc' ? ' ↑' : ' ↓';
        }
    }

    // Funções de exportação
    function exportToHTML() {
        const html = `
            <!DOCTYPE html>
            <html>
            <head><title>Resultados da Busca</title></head>
            <body>
                <h1>Resultados da Busca</h1>
                <table border="1">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Título</th>
                            <th>Revista</th>
                            <th>Autores</th>
                            <th>Link</th>
                            <th>Open Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredResults.map(article => `
                            <tr>
                                <td>${formatDate(article['DATA DE PUBLICACAO'])}</td>
                                <td>${article['TITULO DA PUBLICACAO']}</td>
                                <td>${article['REVISTA']}</td>
                                <td>${article['AUTORES']}</td>
                                <td><a href="${article['LINK CANONICO']}" target="_blank">Acessar</a></td>
                                <td>${article['OPEN ACESS']}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'resultados.html';
        a.click();
    }

    function exportToJSON() {
        const blob = new Blob([JSON.stringify(filteredResults, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'resultados.json';
        a.click();
    }

    function exportToCSV() {
        const headers = ['DATA DE PUBLICACAO', 'TITULO DA PUBLICACAO', 'REVISTA', 'AUTORES', 'LINK CANONICO', 'OPEN ACESS'];
        const csvContent = [
            headers.join(','),
            ...filteredResults.map(article => 
                headers.map(header => `"${(article[header] || '').toString().replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'resultados.csv';
        a.click();
    }

    // Event listeners para botões de data
    last6MonthsButton.addEventListener('click', () => {
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        startDateInput.valueAsDate = sixMonthsAgo;
        endDateInput.valueAsDate = today;
    });

    last1YearButton.addEventListener('click', () => {
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        startDateInput.valueAsDate = oneYearAgo;
        endDateInput.valueAsDate = today;
    });

    last18MonthsButton.addEventListener('click', () => {
        const today = new Date();
        const eighteenMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 18, today.getDate());
        startDateInput.valueAsDate = eighteenMonthsAgo;
        endDateInput.valueAsDate = today;
    });

    last2YearsButton.addEventListener('click', () => {
        const today = new Date();
        const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
        startDateInput.valueAsDate = twoYearsAgo;
        endDateInput.valueAsDate = today;
    });

    range2022_2024Button.addEventListener('click', () => {
        startDateInput.value = '2022-01-01';
        endDateInput.value = '2024-12-31';
    });

    range2019_2021Button.addEventListener('click', () => {
        startDateInput.value = '2019-01-01';
        endDateInput.value = '2021-12-31';
    });

    range2016_2018Button.addEventListener('click', () => {
        startDateInput.value = '2016-01-01';
        endDateInput.value = '2018-12-31';
    });

    range2013_2015Button.addEventListener('click', () => {
        startDateInput.value = '2013-01-01';
        endDateInput.value = '2015-12-31';
    });

    range2010_2012Button.addEventListener('click', () => {
        startDateInput.value = '2010-01-01';
        endDateInput.value = '2012-12-31';
    });

    // Event listeners principais
    searchButton.addEventListener('click', searchPubMed);
    
    // Event listeners para filtros
    searchFilter.addEventListener('input', applyFilters);
    columnFilter.addEventListener('change', applyFilters);
    clearFiltersButton.addEventListener('click', () => {
        searchFilter.value = '';
        columnFilter.value = '';
        applyFilters();
    });
    
    // Event listeners para ordenação
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-column');
            sortTable(column);
        });
    });
    
    // Event listeners para exportação
    exportHtmlButton.addEventListener('click', exportToHTML);
    exportJsonButton.addEventListener('click', exportToJSON);
    exportCsvButton.addEventListener('click', exportToCSV);
});
