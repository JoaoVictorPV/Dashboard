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
    const fullscreenButton = document.getElementById('fullscreen-button');
    
    // Elementos do Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalTableContainer = document.getElementById('modal-table-container');

    // Elementos dos Filtros Personalizados
    const addFilterBtn = document.getElementById('add-filter-btn');
    const filterModal = document.getElementById('filter-modal');
    const closeFilterModalBtn = document.getElementById('close-filter-modal');
    const saveFilterBtn = document.getElementById('save-filter-button');
    const savedFiltersContainer = document.getElementById('saved-filters-container');
    const filterNameInput = document.getElementById('filter-name');
    const filterJournalSelector = document.getElementById('filter-journal-selector');
    const filterStartDateInput = document.getElementById('filter-start-date');
    const filterEndDateInput = document.getElementById('filter-end-date');
    const modalDateButtons = filterModal.querySelectorAll('.recent-periods button');
    
    // Botões de data
    const last1MonthButton = document.getElementById('last-1-month');
    const last3MonthsButton = document.getElementById('last-3-months');
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
    const range2005_2009Button = document.getElementById('range-2005-2009');
    const range2000_2004Button = document.getElementById('range-2000-2004');
    const range1990_1999Button = document.getElementById('range-1990-1999');
    const range1980_1989Button = document.getElementById('range-1980-1989');

    // Variáveis globais
    let choicesInstance = null;
    let filterChoicesInstance = null;
    let currentResults = [];
    let filteredResults = [];
    let sortColumn = '';
    let sortDirection = 'asc';
    let currentPage = 1;
    const rowsPerPage = 15;
    let activeFilter = null;

    // Detecção de idioma e traduções
    const lang = window.location.pathname.includes('dashboard_en.html') ? 'en' : 'pt';
    const translations = {
        pt: {
            date: "Data:",
            journals: "Revistas:",
            author: "Autor:",
            keywords: "Palavras:",
            openAccess: "Apenas Open Access",
            allJournals: "Todas as revistas",
            allPubmed: "Todo o Pubmed",
            to: "a",
            journalsLabel: "Revistas:",
            periodLabel: "Período:",
            customRangeLabel: "Intervalo Personalizado:",
            lastMonth: "Último Mês",
            last3Months: "Últimos 3 Meses",
            last6Months: "Últimos 6 Meses",
            lastYear: "Último Ano"
        },
        en: {
            date: "Date:",
            journals: "Journals:",
            author: "Author:",
            keywords: "Keywords:",
            openAccess: "Open Access Only",
            allJournals: "All journals",
            allPubmed: "All of Pubmed",
            to: "to",
            journalsLabel: "Journals:",
            periodLabel: "Period:",
            customRangeLabel: "Custom Range:",
            lastMonth: "Last Month",
            last3Months: "Last 3 Months",
            last6Months: "Last 6 Months",
            lastYear: "Last Year"
        }
    };
    const T = translations[lang];

    // Adicionar traduções para mensagens de erro
    const errorMessages = {
        pt: {
            noFilterName: 'Por favor, dê um nome ao filtro.',
            noJournalSelected: 'Por favor, selecione pelo menos uma revista.',
            noDateSelected: 'Por favor, selecione um período ou um intervalo de datas.',
            noSearchCriteria: 'Por favor, preencha pelo menos um campo de busca.',
            noResults: 'Nenhum resultado encontrado para os critérios fornecidos.',
            fetchError: 'Ocorreu um erro ao buscar os dados no PubMed. Verifique sua conexão ou tente novamente mais tarde.'
        },
        en: {
            noFilterName: 'Please enter a name for the filter.',
            noJournalSelected: 'Please select at least one journal.',
            noDateSelected: 'Please select a period or a date range.',
            noSearchCriteria: 'Please fill in at least one search field.',
            noResults: 'No results found for the given criteria.',
            fetchError: 'An error occurred while fetching data from PubMed. Check your connection or try again later.'
        }
    };
    const MSG = errorMessages[lang];

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
        { "issn": "1524-4741", "abbr": "JBR-BTR", "name": "Journal of the Belgian Society of Radiology (JBR-BTR)" },
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
        { "issn": "1526-632X", "abbr": "Neurology", "name": "Neurology" },
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
            itemSelectText: '', // Remove o texto "pressione para selecionar"
            addItems: false
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

        // Adiciona T00:00:00 para garantir que a data seja interpretada no fuso horário local e evitar erros de um dia
        const date = new Date(dateString.includes('T') ? dateString : dateString + 'T00:00:00');
        
        // Verifica se a data é válida
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${day}/${month}/${year}`;
        }

        // 2. Lógica de fallback para outros formatos (ex: "YYYY Mon DD")
        const monthMap = {
            'jan': '01', 'janeiro': '01', 'feb': '02', 'fevereiro': '02', 'mar': '03', 'março': '03',
            'apr': '04', 'abril': '04', 'may': '05', 'maio': '05', 'jun': '06', 'junho': '06',
            'jul': '07', 'julho': '07', 'aug': '08', 'ago': '08', 'agosto': '08', 'sep': '09', 'set': '09', 'setembro': '09',
            'oct': '10', 'out': '10', 'outubro': '10', 'nov': '11', 'novembro': '11', 'dec': '12', 'dezembro': '12'
        };
        
        const cleanedString = dateString.toLowerCase().replace(/ de /g, ' ').replace(/[^a-z0-9\s-]/g, '');
        const parts = cleanedString.split(/[\s-]+/); // Divide por espaço ou hífen

        let year = '';
        let month = '';
        let day = '';

        // Extrai o ano (4 dígitos)
        const yearMatch = cleanedString.match(/\b\d{4}\b/);
        if (yearMatch) {
            year = yearMatch[0].slice(-2);
        }

        // Extrai o mês
        for (const part of parts) {
            for (const monthName in monthMap) {
                if (part.startsWith(monthName)) {
                    month = monthMap[monthName];
                    break;
                }
            }
            if (month) break;
        }

        // Extrai o dia (se houver)
        const dayMatch = cleanedString.match(/\b\d{1,2}\b/);
        if (dayMatch && dayMatch[0].length < 4) { // Garante que não é o ano
             day = dayMatch[0].padStart(2, '0');
        }

        // Se encontrou ano e mês, retorna a data (com dia padrão 15 se não encontrado)
        if (year && month) {
            return `${day || '15'}/${month}/${year}`;
        }

        // Se encontrou apenas o ano, retorna o primeiro dia do ano
        if (year) {
            return `01/01/${year}`;
        }

        // Se nada funcionar, retorna a string original
        return dateString;
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
                ? `<svg class="icon-v" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`
                : `<svg class="icon-x" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`;
            
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
            showMessage(MSG.noSearchCriteria, 'warning');
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
                showMessage(MSG.noResults, 'info');
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
            showMessage(MSG.fetchError, 'error');
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
        const searchSummaryContent = getSearchSummaryHTML();

        // Definição dos ícones SVG para o HTML exportado
        const iconLink = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="vertical-align: middle; fill: #667eea;"><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8v-2z"/></svg>`;
        const iconAccessYes = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="vertical-align: middle; fill: #27ae60;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
        const iconAccessNo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" style="vertical-align: middle; fill: #c0392b;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Resultados da Busca Científica</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f4f7f6; color: #333; }
                    .container { max-width: 1200px; margin: 0 auto; background: #ffffff; padding: 25px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
                    h1 { color: #2a5298; font-size: 28px; border-bottom: 3px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; }
                    .search-summary { background-color: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #495057; border: 1px solid #dee2e6; }
                    table { width: 100%; border-collapse: collapse; font-size: 16px; }
                    th, td { padding: 15px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #667eea; color: white; font-size: 18px; }
                    td { vertical-align: middle; }
                    tr:nth-child(even) { background-color: #e9ecef; }
                    tr:hover { background-color: #d4d8f0; }
                    a { color: #667eea; text-decoration: none; font-weight: bold; }
                    a:hover { text-decoration: underline; }
                    .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #777; }
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
                                <th style="text-align: center;">Link</th>
                                <th style="text-align: center;">Open Access</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredResults.map(article => `
                                <tr>
                                    <td>${formatDate(article['DATA DE PUBLICACAO'])}</td>
                                    <td>${article['TITULO DA PUBLICACAO']}</td>
                                    <td>${article['REVISTA']}</td>
                                    <td>${article['AUTORES']}</td>
                                    <td style="text-align: center;">${article['LINK CANONICO'] ? `<a href="${article['LINK CANONICO']}" target="_blank">${iconLink}</a>` : '-'}</td>
                                    <td style="text-align: center;">${article['OPEN ACESS'] === 'Sim' ? iconAccessYes : iconAccessNo}</td>
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
    last1MonthButton.addEventListener('click', () => {
        const today = new Date();
        const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        startDateInput.valueAsDate = oneMonthAgo;
        endDateInput.valueAsDate = today;
    });

    last3MonthsButton.addEventListener('click', () => {
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        startDateInput.valueAsDate = threeMonthsAgo;
        endDateInput.valueAsDate = today;
    });

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

    range2005_2009Button.addEventListener('click', () => {
        startDateInput.value = '2005-01-01';
        endDateInput.value = '2009-12-31';
    });

    range2000_2004Button.addEventListener('click', () => {
        startDateInput.value = '2000-01-01';
        endDateInput.value = '2004-12-31';
    });

    range1990_1999Button.addEventListener('click', () => {
        startDateInput.value = '1990-01-01';
        endDateInput.value = '1999-12-31';
    });

    range1980_1989Button.addEventListener('click', () => {
        startDateInput.value = '1980-01-01';
        endDateInput.value = '1989-12-31';
    });

    // Event listeners principais
    searchButton.addEventListener('click', () => {
        activeFilter = null; // Garante que não há filtro ativo para buscas manuais
        searchPubMed();
    });
    
    // Event listeners para filtros
    searchFilter.addEventListener('input', applyFilters);
    columnFilter.addEventListener('change', applyFilters);
    clearFiltersButton.addEventListener('click', () => {
        searchFilter.value = '';
        columnFilter.value = '';
        applyFilters();
    });
    
    // Event listener para ordenação (usando delegação de evento)
    let touchEventFired = false;
    function handleSortEvent(event) {
        if (event.type === 'touchend') {
            touchEventFired = true;
        }
        // O evento de clique é ignorado se um toque acabou de acontecer
        if (event.type === 'click' && touchEventFired) {
            touchEventFired = false;
            return;
        }

        const header = event.target.closest('.sortable');
        if (header) {
            const column = header.getAttribute('data-column');
            sortTable(column);
        }
        
        // Reseta o flag após um pequeno atraso
        setTimeout(() => {
            touchEventFired = false;
        }, 500);
    }

    resultsTable.querySelector('thead').addEventListener('click', handleSortEvent);
    resultsTable.querySelector('thead').addEventListener('touchend', handleSortEvent);
    
    // Event listeners para exportação
    exportHtmlButton.addEventListener('click', exportToHTML);

    // Função para limpar os parâmetros de busca
    function clearSearchParameters() {
        activeFilter = null; // Reseta o filtro ativo
        if (choicesInstance) {
            // Destrói e recria a instância para garantir que o seletor volte ao estado original limpo
            choicesInstance.destroy();
            journalSelector.innerHTML = '';
            populateJournalSelector(journals);
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

    function getSearchSummaryHTML() {
        let summaryParts = [];

        // Lógica de exibição de data/período
        if (activeFilter && activeFilter.period) {
            const periodMap = { '1m': T.lastMonth, '3m': T.last3Months, '6m': T.last6Months, '12m': T.lastYear };
            const periodText = periodMap[activeFilter.period] || activeFilter.period;
            summaryParts.push(`<strong>${T.periodLabel}</strong> ${periodText}`);
        } else {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            if (startDate && endDate) {
                summaryParts.push(`<strong>${T.date}</strong> ${formatDate(startDate)} ${T.to} ${formatDate(endDate)}`);
            }
        }

        const selectedOptions = choicesInstance.getValue(true);
        if (selectedOptions.length > 0) {
            if (selectedOptions.includes('all_journals')) {
                summaryParts.push(`<strong>${T.journals}</strong> ${T.allJournals}`);
            } else if (selectedOptions.includes('all_pubmed')) {
                summaryParts.push(`<strong>${T.journals}</strong> ${T.allPubmed}`);
            } else {
                const journalNames = selectedOptions.map(value => {
                    const journal = journals.find(j => j.issn === value);
                    return journal ? journal.abbr : '';
                }).filter(Boolean).join(', ');
                summaryParts.push(`<strong>${T.journals}</strong> ${journalNames}`);
            }
        }

        const author = authorInput.value.trim();
        if (author) {
            summaryParts.push(`<strong>${T.author}</strong> ${author}`);
        }

        const keywords = keywordsInput.value.trim();
        if (keywords) {
            summaryParts.push(`<strong>${T.keywords}</strong> ${keywords}`);
        }

        if (openAccessOnlyCheckbox.checked) {
            summaryParts.push(`<strong>${T.openAccess}</strong>`);
        }

        return summaryParts.join('. ');
    }

    // Função para exibir o resumo dos parâmetros de busca
    function displaySearchSummary() {
        const summaryHTML = getSearchSummaryHTML();
        if (summaryHTML) {
            searchSummaryDiv.innerHTML = summaryHTML;
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

    // --- LÓGICA DOS FILTROS PERSONALIZADOS ---

    // Função para popular o seletor de revistas do modal
    function populateFilterModalSelector() {
        journals.forEach(journal => {
            const option = document.createElement('option');
            option.value = journal.issn;
            option.textContent = journal.name;
            filterJournalSelector.appendChild(option);
        });

        filterChoicesInstance = new Choices(filterJournalSelector, {
            removeItemButton: true,
            searchPlaceholderValue: "Digite para procurar...",
            noResultsText: 'Nenhum resultado encontrado',
            itemSelectText: '',
            addItems: false
        });
    }

    // Função para resetar o formulário do modal, recriando o seletor de revistas
    function resetFilterModal() {
        filterNameInput.value = '';
        filterStartDateInput.value = '';
        filterEndDateInput.value = '';
        modalDateButtons.forEach(btn => btn.classList.remove('active'));

        // Garante que o seletor de revistas seja reiniciado
        if (filterChoicesInstance) {
            filterChoicesInstance.destroy();
            filterChoicesInstance = null;
        }
        filterJournalSelector.innerHTML = '';
        populateFilterModalSelector();
    }

    // Abrir e fechar o modal de filtros
    if (addFilterBtn) {
        addFilterBtn.addEventListener('click', () => {
            resetFilterModal(); // Reseta e recria o modal
            filterModal.style.display = 'flex';
        });
    }

    if (closeFilterModalBtn) {
        closeFilterModalBtn.addEventListener('click', () => {
            filterModal.style.display = 'none';
        });
    }

    filterModal.addEventListener('click', (event) => {
        if (event.target === filterModal) {
            filterModal.style.display = 'none';
        }
    });

    // Lógica dos botões de período dentro do modal
    modalDateButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões
            modalDateButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona a classe 'active' apenas ao botão clicado
            button.classList.add('active');

            // Apenas marca o botão como ativo e limpa as datas personalizadas para evitar confusão
            filterStartDateInput.value = '';
            filterEndDateInput.value = '';
        });
    });

    // Limpa o período se a data personalizada for alterada
    filterStartDateInput.addEventListener('change', () => {
        modalDateButtons.forEach(btn => btn.classList.remove('active'));
    });
    filterEndDateInput.addEventListener('change', () => {
        modalDateButtons.forEach(btn => btn.classList.remove('active'));
    });

    // Função para salvar o filtro
    function saveFilter() {
        const name = filterNameInput.value.trim();
        const selectedJournals = filterChoicesInstance.getValue(true);
        const startDateValue = filterStartDateInput.value;
        const endDateValue = filterEndDateInput.value;
        const activeButton = filterModal.querySelector('.recent-periods button.active');

        // Validação
        if (!name) {
            alert(MSG.noFilterName);
            return;
        }
        if (selectedJournals.length === 0) {
            alert(MSG.noJournalSelected);
            return;
        }
        if (!activeButton && (!startDateValue || !endDateValue)) {
            alert(MSG.noDateSelected);
            return;
        }
        
        let period = null;
        if (activeButton) {
            period = activeButton.dataset.period;
        }

        const newFilter = {
            id: Date.now(),
            name: name,
            journals: selectedJournals,
            startDate: period ? null : startDateValue,
            endDate: period ? null : endDateValue,
            period: period
        };

        let savedFilters = JSON.parse(localStorage.getItem('customFilters')) || [];
        savedFilters.push(newFilter);
        localStorage.setItem('customFilters', JSON.stringify(savedFilters));

        renderSavedFilters();
        filterModal.style.display = 'none';
        resetFilterModal(); // Limpa o formulário do modal
    }

    saveFilterBtn.addEventListener('click', saveFilter);

    // Função para renderizar os filtros salvos
    function renderSavedFilters() {
        savedFiltersContainer.innerHTML = '';
        let savedFilters = JSON.parse(localStorage.getItem('customFilters')) || [];

        savedFilters.forEach(filter => {
            const button = document.createElement('button');
            button.className = 'saved-filter-button';
            button.dataset.id = filter.id;

            let summary = `<strong>${filter.name}</strong><br>`;
            if (filter.journals && filter.journals.length > 0) {
                const journalNames = filter.journals.map(issn => {
                    const journal = journals.find(j => j.issn === issn);
                    return journal ? journal.abbr : '';
                }).join(', ');
                summary += `<span class="filter-summary">${T.journalsLabel} ${journalNames}</span><br>`;
            }
            if (filter.period) {
                const periodMap = { '1m': T.lastMonth, '3m': T.last3Months, '6m': T.last6Months, '12m': T.lastYear };
                const periodText = periodMap[filter.period] || filter.period;
                summary += `<span class="filter-summary">${T.periodLabel} ${periodText}</span>`;
            } else if (filter.startDate && filter.endDate) {
                summary += `<span class="filter-summary">${T.periodLabel} ${formatDate(filter.startDate)} - ${formatDate(filter.endDate)}</span>`;
            }

            button.innerHTML = `
                <div>${summary}</div>
                <button class="delete-filter-btn" data-id="${filter.id}" title="Excluir filtro">&times;</button>
            `;

            savedFiltersContainer.appendChild(button);
        });

        // Adicionar event listeners após a renderização
        addFilterActionListeners();
    }

    // Função para adicionar listeners aos botões de filtro
    function addFilterActionListeners() {
        document.querySelectorAll('.saved-filter-button').forEach(button => {
            button.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-filter-btn')) {
                    return; // Não aplica o filtro se o botão de deletar foi clicado
                }
                applyFilter(button.dataset.id);
            });
        });

        document.querySelectorAll('.delete-filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                deleteFilter(button.dataset.id);
            });
        });
    }

    // Função para aplicar um filtro salvo
    function applyFilter(id) {
        let savedFilters = JSON.parse(localStorage.getItem('customFilters')) || [];
        const filter = savedFilters.find(f => f.id == id);

        if (filter) {
            activeFilter = filter; // Define o filtro atual como ativo
            clearSearchParameters(); // Limpa os campos antes de aplicar

            choicesInstance.setChoiceByValue(filter.journals);
            
            if (filter.period) {
                const today = new Date();
                let startDate = new Date();
                if (filter.period === '1m') startDate.setMonth(today.getMonth() - 1);
                if (filter.period === '3m') startDate.setMonth(today.getMonth() - 3);
                if (filter.period === '6m') startDate.setMonth(today.getMonth() - 6);
                if (filter.period === '12m') startDate.setFullYear(today.getFullYear() - 1);
                
                startDateInput.valueAsDate = startDate;
                endDateInput.valueAsDate = today;

            } else {
                startDateInput.value = filter.startDate;
                endDateInput.value = filter.endDate;
            }

            // Atraso para garantir que o Choices.js processe os valores antes da busca
            setTimeout(() => {
                searchPubMed();
            }, 100);
        }
    }

    // Função para deletar um filtro
    function deleteFilter(id) {
        let savedFilters = JSON.parse(localStorage.getItem('customFilters')) || [];
        const updatedFilters = savedFilters.filter(f => f.id != id);
        localStorage.setItem('customFilters', JSON.stringify(updatedFilters));
        renderSavedFilters();
    }

    // Renderizar filtros ao carregar a página
    renderSavedFilters();


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

    // Funções do Modal de Tela Cheia
    function renderModalTable(results) {
        let tableHTML = `
            <table id="modal-results-table">
                <thead>
                    <tr>
                        <th data-column="DATA DE PUBLICACAO" class="sortable col-date">Data <span class="sort-arrow"></span></th>
                        <th data-column="TITULO DA PUBLICACAO" class="sortable col-title">Título <span class="sort-arrow"></span></th>
                        <th data-column="REVISTA" class="sortable col-journal">Revista <span class="sort-arrow"></span></th>
                        <th data-column="AUTORES" class="sortable col-authors">Autores <span class="sort-arrow"></span></th>
                        <th class="col-link">Link</th>
                        <th data-column="OPEN ACESS" class="sortable col-access">Open Access <span class="sort-arrow"></span></th>
                    </tr>
                </thead>
                <tbody>
        `;

        results.forEach(article => {
            const isOpenAccess = article['OPEN ACESS'] === 'Sim';
            const openAccessIcon = isOpenAccess 
                ? `<svg class="icon-v" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`
                : `<svg class="icon-x" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`;
            
            const fullAuthors = article['AUTORES'] || '';
            const truncatedAuthorsModal = fullAuthors.length > 20 ? fullAuthors.substring(0, 20) + '...' : fullAuthors;

            tableHTML += `
                <tr>
                    <td class="col-date">${formatDate(article['DATA DE PUBLICACAO'])}</td>
                    <td class="col-title">${article['TITULO DA PUBLICACAO']}</td>
                    <td class="col-journal">${article['REVISTA']}</td>
                    <td class="col-authors" title="${fullAuthors}">${truncatedAuthorsModal}</td>
                    <td class="col-link">${article['LINK CANONICO'] ? `<a href="${article['LINK CANONICO']}" target="_blank">🔗</a>` : '-'}</td>
                    <td class="col-access ${isOpenAccess ? 'open-access-yes' : 'open-access-no'}">${openAccessIcon}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        modalTableContainer.innerHTML = tableHTML;
    }

    fullscreenButton.addEventListener('click', () => {
        renderModalTable(filteredResults);
        const modalThead = modalTableContainer.querySelector('thead');
        if (modalThead) {
            modalThead.removeEventListener('click', handleSortEvent); // Remove listener antigo para evitar duplicatas
            modalThead.removeEventListener('touchend', handleSortEvent);
            modalThead.addEventListener('click', handleSortEvent);
            modalThead.addEventListener('touchend', handleSortEvent);
        }
        modalOverlay.style.display = 'flex';
    });

    modalCloseButton.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });
