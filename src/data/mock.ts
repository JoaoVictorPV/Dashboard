import type { PubMedArticle, SearchResponse } from '../types';

const mockArticles: PubMedArticle[] = [
  { pmid: '39584201', title: 'Foundation models in diagnostic radiology: evaluation, governance and clinical translation', journal: 'Radiology', journalAbbreviation: 'Radiology', authors: ['Almeida R', 'Chen K', 'Singh P'], publicationDate: '2026 Jan', doi: '10.1148/radiol.245842', pmcId: 'PMC11958420', hasAbstract: true, abstract: 'Foundation models have the potential to reshape image interpretation. This review examines external validation, calibration, workflow integration and the governance requirements for safe clinical deployment.' },
  { pmid: '39476118', title: 'Whole-body MRI for musculoskeletal disease: a prospective multicentre study', journal: 'European Radiology', journalAbbreviation: 'Eur Radiol', authors: ['Costa M', 'Liu A', 'Moreira J', 'Dubois F'], publicationDate: '2025 Dec', doi: '10.1007/s00330-025-11204-8', pmcId: null, hasAbstract: true, abstract: 'This multicentre study evaluates diagnostic accuracy and patient-centred outcomes for whole-body MRI in inflammatory musculoskeletal disease.' },
  { pmid: '39345008', title: 'Structured reporting and downstream clinical decisions in emergency imaging', journal: 'Emergency Radiology', journalAbbreviation: 'Emerg Radiol', authors: ['Oliveira V', 'Martins B'], publicationDate: '2025 Nov', doi: '10.1007/s10140-025-02314-2', pmcId: null, hasAbstract: true, abstract: 'Structured reports improved recommendation clarity and reduced time to documented clinical action in a pragmatic emergency imaging cohort.' },
  { pmid: '39277194', title: 'Opportunistic CT screening for osteoporosis: systematic review and meta-analysis', journal: 'Skeletal Radiology', journalAbbreviation: 'Skeletal Radiol', authors: ['Patel S', 'Ramos G', 'Kim H'], publicationDate: '2025 Oct', doi: '10.1007/s00256-025-04711-1', pmcId: 'PMC11800177', hasAbstract: true },
  { pmid: '39111802', title: 'Patient communication of incidental imaging findings: a randomized trial', journal: 'Journal of the American College of Radiology', journalAbbreviation: 'J Am Coll Radiol', authors: ['Reed T', 'Nunes D'], publicationDate: '2025 Sep', doi: '10.1016/j.jacr.2025.07.018', pmcId: null, hasAbstract: false },
];

export function mockSearch(query: string, page: number): SearchResponse {
  return { articles: mockArticles, total: 1284, page, pageSize: 25, query };
}
