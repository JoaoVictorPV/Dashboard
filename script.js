document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const journalSelector = document.getElementById('journal-selector');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const authorInput = document.getElementById('author');
    const keywordsInput = document.getElementById('keywords');
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
    const clearSearchButton = document.getElementById('clear-search-button');
    const searchSummaryDiv = document.getElementById('search-summary');
    const messageContainer = document.getElementById('message-container');
    
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
    let choicesInstance = null;
    let currentResults = [];
    let filteredResults = [];
    let sortColumn = '';
    let sortDirection = 'asc';
    let currentPage = 1;
    const rowsPerPage = 15;

    const journals = [
        { "issn": "2366-004X", "abbr": "Abdom Radiol (NY)", "name": "Abdominal Radiology" },
        { "issn": "1745-3674", "abbr": "Acta Orthop", "name": "Acta Orthopaedica" },
        { "issn": "0001-6926", "abbr": "Acta Med Port", "name": "Acta Médica Portuguesa" },
        { "issn": "0717-9308", "abbr": "Acta Radiol Port", "name": "Acta Radiológica Portuguesa" },
        { "issn": "0195-6108", "abbr": "AJNR Am J Neuroradiol", "name": "American Journal of Neuroradiology" },
        { "issn": "1546-3141", "abbr": "Am J Roentgenol", "name": "American Journal of Roentgenology (AJR)" },
        { "issn": "0363-6143", "abbr": "Am J Sports Med", "name": "The American Journal of Sports Medicine" },
        { "issn": "0717-2161", "abbr": "An Radiol Mexico", "name": "Anales de Radiología México" },
        { "issn": "0003-4819", "abbr": "Ann Intern Med", "name": "Annals of Internal Medicine" },
        { "issn": "1615-1062", "abbr": "Artif Intell Med", "name": "Artificial Intelligence in Medicine" },
        { "issn": "2054-943X", "abbr": "BJR Case Rep", "name": "BJR Case Reports" },
        { "issn": "1754-9485", "abbr": "J Med Imaging Radiat Oncol", "name": "Journal of Medical Imaging and Radiation Oncology" },
        { "issn": "0959-8138", "abbr": "BMJ", "name": "The BMJ (British Medical Journal)" },
        { "issn": "2049-4394", "abbr": "Bone Joint J", "name": "Bone & Joint Journal (BJJ)" },
        { "issn": "0007-1285", "abbr": "Br J Radiol", "name": "British Journal of Radiology" },
        { "issn": "0306-3674", "abbr": "Br J Sports Med", "name": "British Journal of Sports Medicine (BJSM)" },
        { "issn": "0846-5371", "abbr": "Can Assoc Radiol J", "name": "Canadian Association of Radiologists Journal" },
        { "issn": "1535-9476", "abbr": "Cancer Imaging", "name": "Cancer Imaging" },
        { "issn": "0378-6742", "abbr": "Chin Med J (Engl)", "name": "Chinese Medical Journal" },
        { "issn": "1869-1439", "abbr": "Clin Neuroradiol", "name": "Clinical Neuroradiology" },
        { "issn": "1546-1402", "abbr": "Clin Imaging", "name": "Clinical Imaging" },
        { "issn": "0009-921X", "abbr": "Clin Orthop Relat Res", "name": "Clinical Orthopaedics and Related Research (CORR)" },
        { "issn": "0009-9260", "abbr": "Clin Radiol", "name": "Clinical Radiology" },
        { "issn": "0734-4872", "abbr": "Comput Med Imaging Graph", "name": "Computerized Medical Imaging and Graphics" },
        { "issn": "0090-3493", "abbr": "Crit Care Med", "name": "Critical Care Medicine" },
        { "issn": "1877-3818", "abbr": "Curr Radiol Rep", "name": "Current Radiology Reports" },
        { "issn": "2075-4418", "abbr": "Diagnostics (Basel)", "name": "Diagnostics (Seção de Imagem Médica)" },
        { "issn": "1996-3679", "abbr": "Emerg Radiol", "name": "Emergency Radiology" },
        { "issn": "0938-7994", "abbr": "Eur Radiol", "name": "European Radiology" },
        { "issn": "1569-9056", "abbr": "Eur Urol", "name": "European Urology" },
        { "issn": "1268-7731", "abbr": "Foot Ankle Surg", "name": "Foot and Ankle Surgery" },
        { "issn": "1071-1007", "abbr": "Foot Ankle Int", "name": "Foot & Ankle International" },
        { "issn": "2473-0114", "abbr": "Foot Ankle Orthop", "name": "Foot & Ankle Orthopaedics" },
        { "issn": "0016-5107", "abbr": "Gastrointest Endosc", "name": "Gastrointestinal Endoscopy" },
        { "issn": "2468-1229", "abbr": "Hand Surg Rehabil", "name": "Hand Surgery and Rehabilitation" },
        { "issn": "1824-1584", "abbr": "Hellenic J Radiol", "name": "Hellenic Journal of Radiology" },
        { "issn": "1120-7000", "abbr": "Hip Int", "name": "Hip International" },
        { "issn": "1018-6048", "abbr": "Hong Kong J Radiol", "name": "Hong Kong Journal of Radiology" },
        { "issn": "0019-5413", "abbr": "Indian J Orthop", "name": "Indian Journal of Orthopaedics" },
        { "issn": "0971-3026", "abbr": "Indian J Radiol Imaging", "name": "Indian Journal of Radiology and Imaging" },
        { "issn": "1869-4101", "abbr": "Insights Imaging", "name": "Insights Into Imaging" },
        { "issn": "0341-2695", "abbr": "Int Orthop", "name": "International Orthopaedics" },
        { "issn": "0924-2716", "abbr": "Int J Med Inform", "name": "International Journal of Medical Informatics" },
        { "issn": "0020-9996", "abbr": "Invest Radiol", "name": "Investigative Radiology" },
        { "issn": "1727-923X", "abbr": "Iran J Radiol", "name": "Iranian Journal of Radiology" },
        { "issn": "0021-1255", "abbr": "Ir J Med Sci", "name": "Irish Journal of Medical Science" },
        { "issn": "0098-7484", "abbr": "JAMA", "name": "Journal of the American Medical Association (JAMA)" },
        { "issn": "2168-6106", "abbr": "JAMA Intern Med", "name": "JAMA Internal Medicine" },
        { "issn": "1547-542X", "abbr": "J Am Coll Radiol", "name": "Journal of the American College of Radiology (JACR)" },
        { "issn": "0021-9355", "abbr": "J Bone Joint Surg Am", "name": "Journal of Bone & Joint Surgery (JBJS)" },
        { "issn": "1558-214X", "abbr": "JBR-BTR", "name": "Journal of the Belgian Society of Radiology (JBR-BTR)" },
        { "issn": "1524-4741", "abbr": "J Clin Oncol", "name": "Journal of Clinical Oncology (JCO)" },
        { "issn": "0148-639X", "abbr": "J Comput Assist Tomogr", "name": "Journal of Computer Assisted Tomography" },
        { "issn": "1556-0653", "abbr": "J Digit Imaging", "name": "Journal of Digital Imaging (JDI)" },
        { "issn": "2473-4360", "abbr": "J Glob Radiol", "name": "Journal of Global Radiology" },
        { "issn": "0168-8278", "abbr": "J Hepatol", "name": "Journal of Hepatology" },
        { "issn": "2054-8397", "abbr": "J Hip Preserv Surg", "name": "Journal of Hip Preservation Surgery" },
        { "issn": "1053-1807", "abbr": "J Magn Reson Imaging", "name": "Journal of Magnetic Resonance Imaging" },
        { "issn": "2347-336X", "abbr": "J Med Imaging (Bellingham)", "name": "Journal of Medical Imaging (JMI)" },
        { "issn": "1053-8119", "abbr": "Neuroimage", "name": "NeuroImage" },
        { "issn": "2213-1582", "abbr": "Neuroimage Clin", "name": "NeuroImage: Clinical" },
        { "issn": "1051-2284", "abbr": "J Neuroimaging", "name": "Journal of Neuroimaging" },
        { "issn": "1759-8478", "abbr": "J Neurointerv Surg", "name": "Journal of NeuroInterventional Surgery" },
        { "issn": "0949-2658", "abbr": "J Orthop Sci", "name": "Journal of Orthopaedic Science" },
        { "issn": "0736-0266", "abbr": "J Orthop Res", "name": "Journal of Orthopaedic Research (JOR)" },
        { "issn": "1749-799X", "abbr": "J Orthop Surg Res", "name": "Journal of Orthopaedic Surgery and Research" },
        { "issn": "1058-2746", "abbr": "J Shoulder Elbow Surg", "name": "Journal of Shoulder and Elbow Surgery (JSES)" },
        { "issn": "1555-2434", "abbr": "J Thorac Imaging", "name": "Journal of Thoracic Imaging" },
        { "issn": "1556-0864", "abbr": "J Thorac Oncol", "name": "Journal of Thoracic Oncology" },
        { "issn": "0278-4297", "abbr": "J Ultrasound Med", "name": "Journal of Ultrasound in Medicine" },
        { "issn": "2163-3916", "abbr": "J Wrist Surg", "name": "Journal of Wrist Surgery" },
        { "issn": "2666-6383", "abbr": "JSES Int", "name": "JSES International" },
        { "issn": "1867-1071", "abbr": "Jpn J Radiol", "name": "Japanese Journal of Radiology" },
        { "issn": "0968-0160", "abbr": "Knee", "name": "The Knee" },
        { "issn": "0942-2056", "abbr": "Knee Surg Sports Traumatol Arthrosc", "name": "Knee Surgery, Sports Traumatology, Arthroscopy (KSSTA)" },
        { "issn": "1229-6929", "abbr": "Korean J Radiol", "name": "Korean Journal of Radiology" },
        { "issn": "0740-3194", "abbr": "Magn Reson Med", "name": "Magnetic Resonance in Medicine" },
        { "issn": "1347-3182", "abbr": "Magn Reson Med Sci", "name": "Magnetic Resonance in Medical Sciences" },
        { "issn": "1522-5498", "abbr": "Magn Reson Imaging Clin N Am", "name": "Magnetic Resonance Imaging Clinics of North América" },
        { "issn": "1352-8180", "abbr": "Med Image Anal", "name": "Medical Image Analysis" },
        { "issn": "1078-8956", "abbr": "Nat Med", "name": "Nature Medicine" },
        { "issn": "1759-4774", "abbr": "Nat Rev Clin Oncol", "name": "Nature Reviews Clinical Oncology" },
        { "issn": "0028-3940", "abbr": "Neuroradiology", "name": "Neuroradiology" },
        { "issn": "0148-396X", "abbr": "Neurosurgery", "name": "Neurosurgery" },
        { "issn": "1102-6030", "abbr": "Niger J Clin Pract", "name": "Nigerian Journal of Clinical Practice" },
        { "issn": "0028-8443", "abbr": "N Z Med J", "name": "The New Zealand Medical Journal" },
        { "issn": "2164-3024", "abbr": "Open J Radiol", "name": "Open Journal of Radiology" },
        { "issn": "1877-0568", "abbr": "Orthop Traumatol Surg Res", "name": "Orthopaedics & Traumatology: Surgery & Research (OTSR)" },
        { "issn": "1996-3679", "abbr": "Oman Med J", "name": "OMAN Medical Journal" },
        { "issn": "0031-3998", "abbr": "Pediatrics", "name": "Pediatrics" },
        { "issn": "0090-4295", "abbr": "Pediatr Radiol", "name": "Pediatric Radiology" },
        { "issn": "1549-1277", "abbr": "PLoS Med", "name": "PLOS Medicine" },
        { "issn": "1683-3861", "abbr": "Pol J Radiol", "name": "Polish Journal of Radiology" },
        { "issn": "2191-1255", "abbr": "Quant Imaging Med Surg", "name": "Quantitative Imaging in Medicine and Surgery" },
        { "issn": "0033-8389", "abbr": "Radiol Clin North Am", "name": "Radiologic Clinics of North America" },
        { "issn": "0271-5333", "abbr": "Radiographics", "name": "Radiographics" },
        { "issn": "0100-3984", "abbr": "Radiol Bras", "name": "Radiologia Brasileira" },
        { "issn": "2468-3643", "abbr": "Radiol Infect Dis", "name": "Radiology of Infectious Diseases" },
        { "issn": "1865-9649", "abbr": "Radiol Phys Technol", "name": "Radiological Physics and Technology" },
        { "issn": "0033-8419", "abbr": "Radiology", "name": "Radiology" },
        { "issn": "1930-0433", "abbr": "Radiol Case Rep", "name": "Radiology Case Reports" },
        { "issn": "0100-7203", "abbr": "Rev Bras Ginecol Obstet", "name": "Revista Brasileira de Ginecologia e Obstetrícia" },
        { "issn": "0102-3616", "abbr": "Rev Bras Ortop", "name": "Revista Brasileira de Ortopedia (RBO)" },
        { "issn": "0035-1040", "abbr": "Rev Assoc Med Bras (1992)", "name": "Revista da Associação Médica Brasileira (RAMB)" },
        { "issn": "0717-9308", "abbr": "Rev Chil Radiol", "name": "Revista Chilena de Radiologia" },
        { "issn": "0121-2064", "abbr": "Rev Colomb Radiol", "name": "Revista Colombiana de Radiología" },
        { "issn": "1462-0324", "abbr": "Rheumatology (Oxford)", "name": "Rheumatology (Oxford)" },
        { "issn": "1438-9029", "abbr": "Rofo", "name": "RöFo (Fortschritte auf dem Gebiet der Röntgenstrahlen und der bildgebenden erfahren)" },
        { "issn": "1383-469X", "abbr": "Saudi Med J", "name": "Saudi Medical Journal" },
        { "issn": "1089-7860", "abbr": "Semin Musculoskelet Radiol", "name": "Seminars in Musculoskeletal Radiology" },
        { "issn": "1042-2177", "abbr": "Semin Interv Radiol", "name": "Seminars in Interventional Radiology" },
        { "issn": "0037-198X", "abbr": "Semin Roentgenol", "name": "Seminars in Roentgenology" },
        { "issn": "0887-2171", "abbr": "Semin Ultrasound CT MR", "name": "Seminars in Ultrasound, CT and MRI" },
        { "issn": "1758-5732", "abbr": "Shoulder Elbow", "name": "Shoulder & Elbow" },
        { "issn": "0037-5638", "abbr": "Singapore Med J", "name": "Singapore Medical Journal" },
        { "issn": "0364-2348", "abbr": "Skeletal Radiol", "name": "Skeletal Radiology" },
        { "issn": "1998-3652", "abbr": "S Afr J Rad", "name": "South African Journal of Radiology" },
        { "issn": "0268-8697", "abbr": "Spine (Phila Pa 1976)", "name": "Spine" },
        { "issn": "0039-2499", "abbr": "Stroke", "name": "Stroke" },
        { "issn": "0925-4927", "abbr": "Surg Radiol Anat", "name": "Surgical and Radiologic Anatomy" },
        { "issn": "0140-6736", "abbr": "Lancet", "name": "The Lancet" },
        { "issn": "0025-7079", "abbr": "Med J Aust", "name": "The Medical Journal of Australia (MJA)" },
        { "issn": "0028-4793", "abbr": "N Engl J Med", "name": "The New England Journal of Medicine (NEJM)" },
        { "issn": "2226-7330", "abbr": "Neuroradiol J", "name": "The Neuroradiology Journal" },
        { "issn": "0720-6346", "abbr": "Rev Med Interne", "name": "La Revue de Médecine Interne" },
        { "issn": "1179-2026", "abbr": "Tomography", "name": "Tomography" },
        { "issn": "1043-2180", "abbr": "Top Magn Reson Imaging", "name": "Topics in Magnetic Resonance Imaging" },
        { "issn": "1824-1584", "abbr": "Turk J Radiol", "name": "Turkish Journal of Radiology" },
        { "issn": "0960-7692", "abbr": "Ultrasound Obstet Gynecol", "name": "Ultrasound in Obstetrics & Gynecology" },
        { "issn": "1949-8470", "abbr": "World J Radiol", "name": "World Journal of Radiology" }
    ];

    // Função para popular o seletor de revistas
    function populateJournalSelector(journals) {
        // Adicionar opções especiais
        const allJournalsOption = document.createElement('option');
        allJournalsOption.value = 'all_journals';
        allJournalsOption.textContent = 'Todas as revistas';
        journalSelector.appendChild(allJournalsOption);

        const allPubmedOption = document.createElement('option');
        allPubmedOption.value = 'all_pubmed';
        allPubmedOption.textContent = 'Todo o Pubmed';
        journalSelector.appendChild(allPubmedOption);

        journals.forEach(journal => {
            const option = document.createElement('option');
            option.value = journal.issn; // Usar ISSN como valor
            option.textContent = journal.name;
            journalSelector.appendChild(option);
        });

        // Inicializar o Choices.js
        choicesInstance = new Choices(journalSelector, {
            removeItemButton: true,
            searchPlaceholderValue: "Digite para procurar...",
            noResultsText: 'Nenhum resultado encontrado',
            itemSelectText: 'Pressione para selecionar',
        });
    }

    // Função para mostrar loading
    function showLoading() {
        loadingDiv.style.display = 'block';
        resultsInfo.style.display = 'none';
        tableControls.style.display = 'none';
        resultsTable.style.display = 'none';
        messageContainer.style.display = 'none';
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
        
        currentPage = 1; // Resetar para a primeira página
        setupPagination(filteredResults);
        renderTable(filteredResults, currentPage);
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
    function renderTable(results, page = 1) {
        resultsTableBody.innerHTML = '';
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedItems = results.slice(start, end);

        paginatedItems.forEach(article => {
            const row = document.createElement('tr');

            // Truncar autores
            const fullAuthors = article['AUTORES'] || '';
            const truncatedAuthors = fullAuthors.length > 10 ? fullAuthors.substring(0, 10) + '...' : fullAuthors;

            // Ícone de Open Access
            const isOpenAccess = article['OPEN ACESS'] === 'Sim';
            const openAccessIcon = isOpenAccess 
                ? '<span class="open-access-icon-v">V</span>' 
                : '<span class="open-access-icon-x">X</span>';
            
            row.innerHTML = `
                <td class="col-date">${formatDate(article['DATA DE PUBLICACAO'])}</td>
                <td class="col-title" title="${article['TITULO DA PUBLICACAO']}">${article['TITULO DA PUBLICACAO']}</td>
                <td class="col-journal" title="${article['REVISTA']}">${article['REVISTA']}</td>
                <td class="col-authors" title="${fullAuthors}">${truncatedAuthors}</td>
                <td class="col-link">
                    ${article['LINK CANONICO'] ? `<a href="${article['LINK CANONICO']}" target="_blank">🔗</a>` : '-'}
                </td>
                <td class="col-access ${isOpenAccess ? 'open-access-yes' : 'open-access-no'}">
                    ${openAccessIcon}
                </td>
            `;
            
            resultsTableBody.appendChild(row);
        });
    }

    // Função principal de busca no PubMed
    async function searchPubMed() {
        const selectedOptions = choicesInstance.getValue(true);
        let selectedJournals = [];
        let searchAllPubmed = selectedOptions.includes('all_pubmed');
        let searchAllJournals = selectedOptions.includes('all_journals');

        if (!searchAllPubmed && !searchAllJournals) {
            selectedJournals = selectedOptions.map(value => {
                const journalData = journals.find(j => j.issn === value);
                return journalData ? `("${journalData.issn}"[ISSN] OR "${journalData.abbr}"[Journal])` : null;
            }).filter(Boolean);
        } else if (searchAllJournals) {
            selectedJournals = journals.map(journal => {
                return `("${journal.issn}"[ISSN] OR "${journal.abbr}"[Journal])`;
            });
        }
        // Se searchAllPubmed for true, não adicionamos nenhum filtro de revista

        const startDate = startDateInput.value.replace(/-/g, '/');
        const endDate = endDateInput.value.replace(/-/g, '/');
        const author = authorInput.value ? `${authorInput.value}[Author]` : '';
        const keywords = keywordsInput.value.split(',').map(k => k.trim()).filter(k => k).map(k => `"${k}"[Title/Abstract]`);
        const maxResults = 10000; // Valor máximo permitido pela API
        const openAccessOnly = openAccessOnlyCheckbox.checked;

        let term = [];
        if (keywords.length > 0) term.push(keywords.join(' AND '));
        if (author) term.push(author);
        if (selectedJournals.length > 0 && !searchAllPubmed) {
            term.push(`(${selectedJournals.join(' OR ')})`);
        }
        if (startDate && endDate) {
            term.push(`("${startDate}":"${endDate}"[Date - Publication])`);
        }

        // O filtro Open Access será aplicado após a busca inicial
        // if (openAccessOnly) {
        //     term.push("open access[filter]");
        // }

        if (term.length === 0) {
            showMessage('Por favor, preencha pelo menos um campo de busca.', 'warning');
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
                showMessage('Nenhum resultado encontrado para os critérios fornecidos.', 'info');
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
                    'AUTORES': (article.authors || []).map(a => a.name).join(', '),
                    'LINK CANONICO': `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
                    'OPEN ACESS': isOpenAccess() ? 'Sim' : 'Não'
                };
            });

            // Etapa 4: Filtrar por Open Access se a opção estiver marcada
            if (openAccessOnly) {
                results = results.filter(article => article['OPEN ACESS'] === 'Sim');
            }

            // Etapa 5: Pós-filtro para garantir que apenas as revistas selecionadas sejam exibidas
            if (!searchAllPubmed && !searchAllJournals && selectedOptions.length > 0) {
                const selectedJournalObjects = selectedOptions.map(value => journals.find(j => j.issn === value)).filter(Boolean);
                const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                const validNormalizedAbbrs = selectedJournalObjects.map(j => normalize(j.abbr));
                
                results = results.filter(article => {
                    const normalizedArticleJournal = normalize(article['REVISTA']);
                    return validNormalizedAbbrs.some(abbr => normalizedArticleJournal.includes(abbr));
                });
            }

            hideLoading();
            displaySearchSummary();
            showResults(results);

        } catch (error) {
            hideLoading();
            console.error('Erro na busca do PubMed:', error);
            showMessage('Ocorreu um erro ao buscar os dados no PubMed. Verifique sua conexão ou tente novamente mais tarde.', 'error');
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
        
        currentPage = 1; // Resetar para a primeira página ao filtrar
        setupPagination(filteredResults);
        renderTable(filteredResults, currentPage);
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
        
        currentPage = 1; // Resetar para a primeira página ao ordenar
        renderTable(filteredResults, currentPage);
        setupPagination(filteredResults);
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
        const searchSummaryContent = searchSummaryDiv.innerHTML;
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
                        background-color: #f4f7f6;
                        color: #333;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: #ffffff;
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
                    .search-summary {
                        background-color: #e9ecef;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        font-size: 14px;
                        color: #495057;
                        border: 1px solid #dee2e6;
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
                    <div class="search-summary">
                        <p><strong>Total de artigos encontrados: ${currentResults.length}</strong></p>
                        <p>${searchSummaryContent}</p>
                    </div>
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

    // Função para limpar os parâmetros de busca
    function clearSearchParameters() {
        if (choicesInstance) {
            choicesInstance.removeActiveItems();
            choicesInstance.clearInput();
        }
        startDateInput.value = '';
        endDateInput.value = '';
        authorInput.value = '';
        keywordsInput.value = '';
        openAccessOnlyCheckbox.checked = false;
        
        // Limpar a tabela e informações de resultados
        resultsTableBody.innerHTML = '';
        currentResults = [];
        filteredResults = [];
        resultsInfo.style.display = 'none';
        tableControls.style.display = 'none';
        resultsTable.style.display = 'none';
        totalCount.textContent = '0';
    }

    // Função para exibir o resumo dos parâmetros de busca
    function displaySearchSummary() {
        let summaryParts = [];

        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (startDate && endDate) {
            summaryParts.push(`<strong>Data:</strong> ${formatDate(startDate)} a ${formatDate(endDate)}`);
        }

        const selectedOptions = choicesInstance.getValue(true);
        if (selectedOptions.length > 0) {
            if (selectedOptions.includes('all_journals')) {
                summaryParts.push(`<strong>Revistas:</strong> Todas as revistas`);
            } else if (selectedOptions.includes('all_pubmed')) {
                summaryParts.push(`<strong>Revistas:</strong> Todo o Pubmed`);
            } else {
                const journalNames = selectedOptions.map(value => {
                    const journal = journals.find(j => j.issn === value);
                    return journal ? journal.abbr : '';
                }).filter(Boolean).join(', ');
                summaryParts.push(`<strong>Revistas:</strong> ${journalNames}`);
            }
        }

        const author = authorInput.value.trim();
        if (author) {
            summaryParts.push(`<strong>Autor:</strong> ${author}`);
        }

        const keywords = keywordsInput.value.trim();
        if (keywords) {
            summaryParts.push(`<strong>Palavras:</strong> ${keywords}`);
        }

        if (openAccessOnlyCheckbox.checked) {
            summaryParts.push(`<strong>Apenas Open Access</strong>`);
        }

        if (summaryParts.length > 0) {
            searchSummaryDiv.innerHTML = summaryParts.join('. ');
            searchSummaryDiv.style.display = 'block';
        } else {
            searchSummaryDiv.style.display = 'none';
        }
    }

    // Event listener para o botão de limpar busca
    clearSearchButton.addEventListener('click', clearSearchParameters);

    // Função para exibir mensagens
    function showMessage(message, type = 'info') {
        messageContainer.innerHTML = `<p class="message ${type}">${message}</p>`;
        messageContainer.style.display = 'block';
        resultsTable.style.display = 'none';
        tableControls.style.display = 'none';
        resultsInfo.style.display = 'none';
    }

    // Carregar as revistas ao iniciar
    journals.sort((a, b) => a.name.localeCompare(b.name));
    populateJournalSelector(journals);

    // Funções de Paginação
    function setupPagination(items) {
        const paginationContainer = document.getElementById('pagination-container');
        paginationContainer.innerHTML = '';
        const pageCount = Math.ceil(items.length / rowsPerPage);

        if (pageCount <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        paginationContainer.style.display = 'flex';

        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('button');
            btn.innerText = i;
            btn.classList.add('pagination-button');
            if (i === currentPage) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                currentPage = i;
                renderTable(items, currentPage);
                
                document.querySelector('.pagination-button.active').classList.remove('active');
                btn.classList.add('active');
            });
            paginationContainer.appendChild(btn);
        }
    }
});
