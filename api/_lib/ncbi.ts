const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export function ncbiParams(extra: Record<string, string>) {
  const params = new URLSearchParams({ retmode: 'json', tool: process.env.NCBI_TOOL || 'atlas-medico', email: process.env.NCBI_EMAIL || 'joaovictorpv@hotmail.com', ...extra });
  if (process.env.NCBI_API_KEY) params.set('api_key', process.env.NCBI_API_KEY);
  return params;
}

export async function ncbiFetch(path: string, params: URLSearchParams, retmode: 'json' | 'xml' = 'json') {
  if (retmode === 'xml') params.set('retmode', 'xml');
  const response = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': `${process.env.NCBI_TOOL || 'atlas-medico'}/2.0 (${process.env.NCBI_EMAIL || 'joaovictorpv@hotmail.com'})` },
    body: params,
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`NCBI respondeu com status ${response.status}.`);
  return retmode === 'json' ? response.json() : response.text();
}

export function cleanText(value: unknown) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
