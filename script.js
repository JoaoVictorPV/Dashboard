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
    const openAccessOnlyCheckbox = document.getElementById('open-access-only');
    
    // Botões de exportação
    const exportHtmlButton = document.getElementById('export-html-button');
    
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
            option.value = journal.issn; // Usar ISSN como valor
            option.textContent = journal.name;
            journalSelector.appendChild(option);
        });
    }

    const journals = [
        { "issn": "1745-3674", "abbr": "Acta Orthop", "name": "Acta Orthopaedica" },
        { "issn": "2366-004X", "abbr": "Abdom Radiol (NY)", "name": "Abdominal Radiology" },
        { "issn": "0195-6108", "abbr": "AJNR Am J Neuroradiol", "name": "American Journal of Neuroradiology" },
        { "issn": "0361-803X", "abbr": "Am J Roentgenol", "name": "American Journal of Roentgenology (AJR)" },
        { "issn": "0003-4819", "abbr": "Ann Intern Med", "name": "Annals of Internal Medicine" },
        { "issn": "0959-8138", "abbr": "BMJ", "name": "The BMJ (British Medical Journal)" },
        { "issn": "2049-4394", "abbr": "Bone Joint J", "name": "Bone & Joint Journal (BJJ)" },
        { "issn": "0007-1285", "abbr": "Br J Radiol", "name": "British Journal of Radiology" },
        { "issn": "0846-5371", "abbr": "Can Assoc Radiol J", "name": "Canadian Association of Radiologists Journal" },
        { "issn": "1869-1439", "abbr": "Clin Neuroradiol", "name": "Clinical Neuroradiology" },
        { "issn": "0009-921X", "abbr": "Clin Orthop Relat Res", "name": "Clinical Orthopaedics and Related Research (CORR)" },
        { "issn": "0009-9260", "abbr": "Clin Radiol", "name": "Clinical Radiology" },
        { "issn": "0938-7994", "abbr": "Eur Radiol", "name": "European Radiology" },
        { "issn": "1268-7731", "abbr": "Foot Ankle Surg", "name": "Foot and Ankle Surgery" },
        { "issn": "1071-1007", "abbr": "Foot Ankle Int", "name": "Foot & Ankle International" },
        { "issn": "2473-0114", "abbr": "Foot Ankle Orthop", "name": "Foot & Ankle Orthopaedics" },
        { "issn": "0958-2592", "abbr": "Foot (Edinb)", "name": "The Foot" },
        { "issn": "0016-5107", "abbr": "Gastrointest Endosc", "name": "Gastrointestinal Endoscopy" },
        { "issn": "2468-1229", "abbr": "Hand Surg Rehabil", "name": "Hand Surgery and Rehabilitation" },
        { "issn": "1120-7000", "abbr": "Hip Int", "name": "Hip International" },
        { "issn": "0019-5413", "abbr": "Indian J Orthop", "name": "Indian Journal of Orthopaedics" },
        { "issn": "0971-3026", "abbr": "Indian J Radiol Imaging", "name": "Indian Journal of Radiology and Imaging" },
        { "issn": "1869-4101", "abbr": "Insights Imaging", "name": "Insights Into Imaging" },
        { "issn": "0341-2695", "abbr": "Int Orthop", "name": "International Orthopaedics" },
        { "issn": "0020-9996", "abbr": "Invest Radiol", "name": "Investigative Radiology" },
        { "issn": "0098-7484", "abbr": "JAMA", "name": "Journal of the American Medical Association (JAMA)" },
        { "issn": "2168-6106", "abbr": "JAMA Intern Med", "name": "JAMA Internal Medicine" },
        { "issn": "0021-9355", "abbr": "J Bone Joint Surg Am", "name": "Journal of Bone & Joint Surgery (JBJS)" },
        { "issn": "2054-8397", "abbr": "J Hip Preserv Surg", "name": "Journal of Hip Preservation Surgery" },
        { "issn": "1053-1807", "abbr": "J Magn Reson Imaging", "name": "Journal of Magnetic Resonance Imaging" },
        { "issn": "1754-9485", "abbr": "BJR Case Rep", "name": "BJR Case Reports" },
        { "issn": "1759-8478", "abbr": "J Neurointerv Surg", "name": "Journal of NeuroInterventional Surgery" },
        { "issn": "0949-2658", "abbr": "J Orthop Sci", "name": "Journal of Orthopaedic Science" },
        { "issn": "0736-0266", "abbr": "J Orthop Res", "name": "Journal of Orthopaedic Research (JOR)" },
        { "issn": "1749-799X", "abbr": "J Orthop Surg Res", "name": "Journal of Orthopaedic Surgery and Research" },
        { "issn": "1058-2746", "abbr": "J Shoulder Elbow Surg", "name": "Journal of Shoulder and Elbow Surgery (JSES)" },
        { "issn": "0278-4297", "abbr": "J Ultrasound Med", "name": "Journal of Ultrasound in Medicine" },
        { "issn": "2163-3916", "abbr": "J Wrist Surg", "name": "Journal of Wrist Surgery" },
        { "issn": "2666-6383", "abbr": "JSES Int", "name": "JSES International" },
        { "issn": "1867-1071", "abbr": "Jpn J Radiol", "name": "Japanese Journal of Radiology" },
        { "issn": "0968-0160", "abbr": "Knee", "name": "The Knee" },
        { "issn": "0942-2056", "abbr": "Knee Surg Sports Traumatol Arthrosc", "name": "Knee Surgery, Sports Traumatology, Arthroscopy (KSSTA)" },
        { "issn": "1229-6929", "abbr": "Korean J Radiol", "name": "Korean Journal of Radiology" },
        { "issn": "0740-3194", "abbr": "Magn Reson Med", "name": "Magnetic Resonance in Medicine" },
        { "issn": "1347-3182", "abbr": "Magn Reson Med Sci", "name": "Magnetic Resonance in Medical Sciences" },
        { "issn": "1078-8956", "abbr": "Nat Med", "name": "Nature Medicine" },
        { "issn": "1053-8119", "abbr": "Neuroimage", "name": "NeuroImage" },
        { "issn": "0028-3940", "abbr": "Neuroradiology", "name": "Neuroradiology" },
        { "issn": "2164-3024", "abbr": "Open J Radiol", "name": "Open Journal of Radiology" },
        { "issn": "1877-0568", "abbr": "Orthop Traumatol Surg Res", "name": "Orthopaedics & Traumatology: Surgery & Research (OTSR)" },
        { "issn": "1549-1277", "abbr": "PLoS Med", "name": "PLOS Medicine" },
        { "issn": "0033-8389", "abbr": "Radiol Clin North Am", "name": "Radiologic Clinics of North America" },
        { "issn": "0271-5333", "abbr": "Radiographics", "name": "Radiographics" },
        { "issn": "0100-3984", "abbr": "Radiol Bras", "name": "Radiologia Brasileira" },
        { "issn": "0033-8419", "abbr": "Radiology", "name": "Radiology" },
        { "issn": "0100-7203", "abbr": "Rev Bras Ginecol Obstet", "name": "Revista Brasileira de Ginecologia e Obstetrícia" },
        { "issn": "0102-3616", "abbr": "Rev Bras Ortop", "name": "Revista Brasileira de Ortopedia (RBO)" },
        { "issn": "1089-7860", "abbr": "Semin Musculoskelet Radiol", "name": "Seminars in Musculoskeletal Radiology" },
        { "issn": "1758-5732", "abbr": "Shoulder Elbow", "name": "Shoulder & Elbow" },
        { "issn": "0364-2348", "abbr": "Skeletal Radiol", "name": "Skeletal Radiology" },
        { "issn": "0140-6736", "abbr": "Lancet", "name": "The Lancet" },
        { "issn": "0028-4793", "abbr": "N Engl J Med", "name": "The New England Journal of Medicine (NEJM)" },
        { "issn": "0960-7692", "abbr": "Ultrasound Obstet Gynecol", "name": "Ultrasound in Obstetrics & Gynecology" },
        { "issn": "1949-8470", "abbr": "World J Radiol", "name": "World Journal of Radiology" }
    ];
    journals.sort((a, b) => a.name.localeCompare(b.name));
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
        const selectedJournals = Array.from(journalSelector.selectedOptions).map(option => {
            const journalData = journals.find(j => j.issn === option.value);
            return `("${journalData.issn}"[ISSN] OR "${journalData.abbr}"[Journal])`;
        });
        const startDate = startDateInput.value.replace(/-/g, '/');
        const endDate = endDateInput.value.replace(/-/g, '/');
        const author = authorInput.value ? `${authorInput.value}[Author]` : '';
        const keywords = keywordsInput.value.split(',').map(k => k.trim()).filter(k => k).map(k => `"${k}"[Title/Abstract]`);
        const maxResults = parseInt(maxResultsSelect.value);
        const openAccessOnly = openAccessOnlyCheckbox.checked;

        let term = [];
        if (keywords.length > 0) term.push(keywords.join(' AND '));
        if (author) term.push(author);
        if (selectedJournals.length > 0) term.push(`(${selectedJournals.join(' OR ')})`);
        if (startDate && endDate) {
            term.push(`("${startDate}":"${endDate}"[Date - Publication])`);
        }

        // O filtro Open Access será aplicado após a busca inicial
        // if (openAccessOnly) {
        //     term.push("open access[filter]");
        // }

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
            let results = Object.keys(articles).filter(key => key !== 'uids').map(uid => {
                const article = articles[uid];
                
                const isOpenAccess = () => {
                    if (article.articleids) {
                        return article.articleids.some(id => id.idtype === 'pmc');
                    }
                    return false;
                };

                return {
                    'DATA DE PUBLICACAO': article.pubdate,
                    'TITULO DA PUBLICACAO': article.title,
                    'REVISTA': article.source,
                    'AUTORES': article.authors.map(a => a.name).join(', '),
                    'LINK CANONICO': `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
                    'OPEN ACESS': isOpenAccess() ? 'Sim' : 'Não'
                };
            });

            // Etapa 4: Filtrar por Open Access se a opção estiver marcada
            if (openAccessOnly) {
                results = results.filter(article => article['OPEN ACESS'] === 'Sim');
            }

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
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Resultados da Busca Científica</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #1e3c72;
                        color: #333;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: #f4f7f6;
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #2a5298;
                        font-size: 28px;
                        border-bottom: 3px solid #667eea;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 16px;
                    }
                    th, td {
                        padding: 15px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #667eea;
                        color: white;
                        font-size: 18px;
                    }
                    tr:nth-child(even) {
                        background-color: #e9ecef;
                    }
                    tr:hover {
                        background-color: #d4d8f0;
                    }
                    a {
                        color: #667eea;
                        text-decoration: none;
                        font-weight: bold;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    .open-access-yes {
                        color: #27ae60;
                        font-weight: bold;
                    }
                    .open-access-no {
                        color: #c0392b;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 25px;
                        font-size: 12px;
                        color: #777;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Resultados da Busca Científica</h1>
                    <table>
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
                                    <td class="${article['OPEN ACESS'] === 'Sim' ? 'open-access-yes' : 'open-access-no'}">${article['OPEN ACESS']}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Tabela gerada com ferramenta de pesquisa desenvolvida pelo médico radiologista João Victor Pruner Vieira (CRM/PR 30289). Todos os direitos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'resultados_busca.html';
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
});
