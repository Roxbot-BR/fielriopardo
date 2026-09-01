export const ESPN_LOGOS: Record<string, string> = {
  'corinthians': 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
  'internacional': 'https://a.espncdn.com/i/teamlogos/soccer/500/1936.png',
  'platense': 'https://a.espncdn.com/i/teamlogos/soccer/500/7764.png',
  'flamengo': 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
  'palmeiras': 'https://a.espncdn.com/i/teamlogos/soccer/500/1963.png',
  'são paulo': 'https://a.espncdn.com/i/teamlogos/soccer/500/2026.png',
  'sao paulo': 'https://a.espncdn.com/i/teamlogos/soccer/500/2026.png',
  'santos': 'https://a.espncdn.com/i/teamlogos/soccer/500/1968.png',
  'grêmio': 'https://a.espncdn.com/i/teamlogos/soccer/500/1966.png',
  'gremio': 'https://a.espncdn.com/i/teamlogos/soccer/500/1966.png',
  'fluminense': 'https://a.espncdn.com/i/teamlogos/soccer/500/3445.png',
  'botafogo': 'https://a.espncdn.com/i/teamlogos/soccer/500/3444.png',
  'vasco': 'https://a.espncdn.com/i/teamlogos/soccer/500/3454.png',
  'cruzeiro': 'https://a.espncdn.com/i/teamlogos/soccer/500/1955.png',
  'atlético mineiro': 'https://a.espncdn.com/i/teamlogos/soccer/500/1956.png',
  'atletico mineiro': 'https://a.espncdn.com/i/teamlogos/soccer/500/1956.png',
  'fortaleza': 'https://a.espncdn.com/i/teamlogos/soccer/500/3464.png',
  'bahia': 'https://a.espncdn.com/i/teamlogos/soccer/500/9967.png',
  'athletico paranaense': 'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
  'athletico': 'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
  'sport': 'https://a.espncdn.com/i/teamlogos/soccer/500/2030.png',
  'bragantino': 'https://a.espncdn.com/i/teamlogos/soccer/500/6079.png',
  'red bull bragantino': 'https://a.espncdn.com/i/teamlogos/soccer/500/6079.png',
  'goiás': 'https://a.espncdn.com/i/teamlogos/soccer/500/3461.png',
  'goias': 'https://a.espncdn.com/i/teamlogos/soccer/500/3461.png',
  'ceará': 'https://a.espncdn.com/i/teamlogos/soccer/500/3450.png',
  'ceara': 'https://a.espncdn.com/i/teamlogos/soccer/500/3450.png',
  'cuiabá': 'https://a.espncdn.com/i/teamlogos/soccer/500/6474.png',
  'cuiaba': 'https://a.espncdn.com/i/teamlogos/soccer/500/6474.png',
  'juventude': 'https://a.espncdn.com/i/teamlogos/soccer/500/3458.png',
  'america mineiro': 'https://a.espncdn.com/i/teamlogos/soccer/500/1957.png',
  'mirassol': 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
  'vitoria': 'https://a.espncdn.com/i/teamlogos/soccer/500/3457.png',
  'vitória': 'https://a.espncdn.com/i/teamlogos/soccer/500/3457.png',
};

export function getTeamLogo(teamName: string): string | undefined {
  const key = (teamName || '').toLowerCase().trim();
  if (ESPN_LOGOS[key]) return ESPN_LOGOS[key];
  for (const [k, v] of Object.entries(ESPN_LOGOS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return undefined;
}
