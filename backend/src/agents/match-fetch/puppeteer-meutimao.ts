import puppeteer from 'puppeteer-core';

export interface MeutimaoMatch {
  homeTeam: string;
  awayTeam: string;
  matchDate: Date | null;
  competition: string;
  tvChannels: string[];
  rawLine: string;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
  jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11,
};

function parseDate(text: string): Date | null {
  const dmSlash = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (dmSlash) {
    const now = new Date();
    const day = parseInt(dmSlash[1]);
    const month = parseInt(dmSlash[2]) - 1;
    const year = dmSlash[3] ? parseInt(dmSlash[3]) : now.getFullYear();
    return new Date(year, month, day, 21, 0, 0);
  }
  const dmText = text.match(/(\d{1,2})\s+de\s+(\w+)(?:\s+de\s+(\d{4}))?/i);
  if (dmText) {
    const day = parseInt(dmText[1]);
    const monthKey = dmText[2].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[monthKey];
    if (month === undefined) return null;
    const year = dmText[3] ? parseInt(dmText[3]) : new Date().getFullYear();
    return new Date(year, month, day, 21, 0, 0);
  }
  return null;
}

export function normalizeChannel(name: string): string {
  const u = name.toLowerCase().trim();
  if (u === 'disney+' || u === 'espn+') return 'Disney+';
  if (u === 'espn') return 'ESPN';
  if (u.includes('amazon') || u.includes('prime')) return 'Amazon Prime Video';
  if (/caz[eé]\s*tv/i.test(name)) return 'Cazé TV';
  if (u === 'goat') return 'GOAT';
  if (u === 'sbt') return 'SBT';
  if (u === 'record' || u === 'recordtv' || u === 'record tv') return 'RecordTV';
  if (u === 'band' || u.includes('bandeirante') || u === 'tv band') return 'TV Band';
  if (u.includes('globoplay')) return 'Globoplay';
  if (u === 'globo' || u === 'tv globo') return 'TV Globo';
  // getv / ge.tv is Globo Esporte TV — treat as Globo stream
  if (u === 'getv' || u === 'ge.tv' || u === 'ge tv') return 'TV Globo';
  if (u.includes('sportv') || u.includes('sporttv')) return 'SporTV';
  if (u.includes('premiere')) return 'Premiere';
  if (u.includes('conmebol')) return 'CONMEBOL TV';
  if (u.includes('paramount')) return 'Paramount+';
  return name.trim();
}

// Parse "Transmissão: ESPN e Disney+" → ['ESPN', 'Disney+']
function parseTransmissaoLine(line: string): string[] {
  const m = line.match(/[Tt]ransmiss[aã][o]?[:\s]+(.+)/);
  if (!m) return [];
  const raw = m[1].replace(/\(.*?\)/g, '').trim();
  return raw.split(/,|\se\s|\s&\s/).map((s) => normalizeChannel(s.trim())).filter((s) => s.length > 1);
}

export async function scrapeMeutimaoMatches(): Promise<MeutimaoMatch[]> {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
    timeout: 30000,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );
    await page.goto('https://www.meutimao.com.br/proximos-jogos-do-corinthians', {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const text = await page.evaluate(() => document.body.innerText);
    return parseMatchesFromText(text);
  } finally {
    await browser.close();
  }
}

export function parseMatchesFromText(fullText: string): MeutimaoMatch[] {
  const results: MeutimaoMatch[] = [];
  const lines = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Real meutimao format: "Platense x Corinthians: informações da partida"
  // Also plain: "Platense x Corinthians"
  const vsPattern = /^([A-Za-zÀ-ú0-9\s\.\-\']+?)\s+(?:[xX×]|vs\.?)\s+([A-Za-zÀ-ú0-9\s\.\-\']+?)(?::\s*informa|$)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 120) continue;
    const vsMatch = line.match(vsPattern);
    if (!vsMatch) continue;

    const homeTeam = vsMatch[1].trim();
    const awayTeam = vsMatch[2].trim();

    if (homeTeam.split(' ').length > 6 || awayTeam.split(' ').length > 6) continue;
    if (homeTeam.length < 2 || awayTeam.length < 2) continue;

    // Context: this line + next 8 lines
    const contextLines = lines.slice(i, Math.min(lines.length, i + 9));

    let matchDate: Date | null = null;
    for (const cl of contextLines) {
      const d = parseDate(cl);
      if (d) { matchDate = d; break; }
    }

    let tvChannels: string[] = [];
    for (const cl of contextLines) {
      if (/[Tt]ransmiss/i.test(cl)) {
        tvChannels = parseTransmissaoLine(cl);
        break;
      }
    }

    let competition = '';
    const ctx = contextLines.join(' ').toLowerCase();
    if (ctx.includes('libertadores')) competition = 'Libertadores';
    else if (ctx.includes('sul-americana') || ctx.includes('sulamericana')) competition = 'Copa Sul-Americana';
    else if (ctx.includes('copa do brasil')) competition = 'Copa do Brasil';
    else if (ctx.includes('paulist')) competition = 'Campeonato Paulista';
    else if (ctx.includes('brasileir')) competition = 'Brasileirão Série A';

    results.push({ homeTeam, awayTeam, matchDate, competition, tvChannels, rawLine: line });
  }

  return results;
}
