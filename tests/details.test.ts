import { describe, expect, it } from 'vitest';
import { extractAuthorAffiliations } from '../api/pubmed/details.js';

describe('detalhes PubMed', () => {
  it('associa múltiplas afiliações ao autor correto', () => {
    const xml = `<Author ValidYN="Y">
      <LastName>Silva</LastName><ForeName>Ana M</ForeName><Initials>AM</Initials>
      <AffiliationInfo><Affiliation>Universidade de São Paulo, São Paulo, Brazil.</Affiliation></AffiliationInfo>
      <AffiliationInfo><Affiliation>Hospital das Clínicas, São Paulo, Brazil.</Affiliation></AffiliationInfo>
    </Author>
    <Author ValidYN="Y"><LastName>Chen</LastName><Initials>K</Initials></Author>`;
    expect(extractAuthorAffiliations(xml)).toEqual([{
      name: 'Silva AM',
      affiliations: ['Universidade de São Paulo, São Paulo, Brazil.', 'Hospital das Clínicas, São Paulo, Brazil.'],
    }]);
  });

  it('aceita autoria coletiva quando há afiliação', () => {
    const xml = '<Author><CollectiveName>Atlas Study Group</CollectiveName><AffiliationInfo><Affiliation>International Consortium</Affiliation></AffiliationInfo></Author>';
    expect(extractAuthorAffiliations(xml)).toEqual([{ name: 'Atlas Study Group', affiliations: ['International Consortium'] }]);
  });
});
