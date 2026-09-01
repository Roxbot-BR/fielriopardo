/**
 * Mapeamento de nomes de times para arquivos SVG no Wikimedia Commons
 */
const WIKIMEDIA_LOGOS: Record<string, string> = {
  'palmeiras': 'Palmeiras_logo.svg',
  'botafogo': 'Botafogo_de_Futebol_e_Regatas_logo.svg',
  'atletico mineiro': 'Clube_Atlético_Mineiro_logo.svg',
  'atletico-mg': 'Clube_Atlético_Mineiro_logo.svg',
  'gremio': 'Gremio_logo.svg',
  'grêmio': 'Gremio_logo.svg',
  'estudiantes': 'Escudo_de_Estudiantes_de_La_Plata.svg',
  'estudiantes de la plata': 'Escudo_de_Estudiantes_de_La_Plata.svg',
  'remo': 'Clube_do_Remo.svg',
  'mirassol': 'Mirassol_Futebol_Clube_logo.svg',
  'bahia': 'Esporte_Clube_Bahia_logo.svg',
  'fortaleza': 'Fortaleza_Esporte_Clube_logo.svg',
  'cuiaba': 'Cuiabá_Esporte_Clube_logo.svg',
  'cuiabá': 'Cuiabá_Esporte_Clube_logo.svg',
  'criciuma': 'Criciúma_Esporte_Clube_logo.svg',
  'criciúma': 'Criciúma_Esporte_Clube_logo.svg',
  'juventude': 'Esporte_Clube_Juventude_logo.svg',
  'bragantino': 'Red_Bull_Bragantino_logo.svg',
  'red bull bragantino': 'Red_Bull_Bragantino_logo.svg',
  'atletico paranaense': 'Club_Athletico_Paranaense_logo.svg',
  'athletico': 'Club_Athletico_Paranaense_logo.svg',
  'chapecoense': 'Associação_Chapecoense_de_Futebol_logo.svg',
  'ceara': 'Ceará_Sporting_Club_logo.svg',
  'ceará': 'Ceará_Sporting_Club_logo.svg',
};

/**
 * Normaliza nome do time para busca
 */
function normalizeTeamName(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Busca logo do time no Wikimedia Commons
 * Retorna URL no formato: https://commons.wikimedia.org/wiki/Special:FilePath/{arquivo}?width=200
 */
export function getWikimediaLogo(teamName: string): string | undefined {
  const normalized = normalizeTeamName(teamName);
  
  // Busca exata
  if (WIKIMEDIA_LOGOS[normalized]) {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${WIKIMEDIA_LOGOS[normalized]}?width=200`;
  }
  
  // Busca parcial
  for (const [key, file] of Object.entries(WIKIMEDIA_LOGOS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=200`;
    }
  }
  
  return undefined;
}

/**
 * Busca logo combinando ESPN e Wikimedia
 */
export function getTeamLogoWithFallback(teamName: string, espnLogo?: string): string | undefined {
  // Prioridade 1: logo da ESPN se disponível
  if (espnLogo) return espnLogo;
  
  // Prioridade 2: Wikimedia Commons
  return getWikimediaLogo(teamName);
}
