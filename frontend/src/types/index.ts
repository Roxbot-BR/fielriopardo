export type UserRole = 'USER' | 'ADMIN' | 'MASTER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  fullName: string;
  nick: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  roles: UserRole[];
  avatarUrl: string | null;
  createdAt: string;
  isActive?: boolean;
  birthDate?: string;
  notifyBolaoOpen?: boolean;
  notifyBolaoClose?: boolean;
  notifyRanking?: boolean;
  notifyBirthday?: boolean;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed';

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'PENALTY';
  team: 'HOME' | 'AWAY';
  playerName: string;
}

export interface MatchStats {
  possession: [number, number];
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  broadcastUrls?: Record<string, string>;
}

export interface Match {
  id: string;
  competition: string;
  season: string;
  roundNumber: number | null;
  roundLabel: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  matchDate: string;
  stadium: string;
  city: string;
  tvChannel: string | null;
  streamUrl: string | null;
  radioUrl: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  bolaoOpen: boolean;
  matchStats: MatchStats | null;
  matchEvents: MatchEvent[];
  dateConfirmed?: boolean;
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  changeCount: number;
  submittedAt: string;
}

export interface MatchScore {
  id: string;
  userId: string;
  matchId: string;
  points: number;
  isSoleWinner: boolean;
  predictedHome: number;
  predictedAway: number;
  actualHome: number | null;
  actualAway: number | null;
  submittedAt?: string;
  match?: {
    homeTeam: string;
    awayTeam: string;
    homeTeamLogo?: string;
    awayTeamLogo?: string;
    competition: string;
    roundLabel?: string;
    roundNumber?: number;
    season?: string;
    matchDate: string;
    status: string;
  };
}

export interface SeasonRanking {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'nick' | 'avatarUrl'>;
  season: string;
  totalPoints: number;
  gamesPlayed: number;
  gamesWon: number;
  soleWins: number;
  totalPredictions?: number;
  position: number;
}

export type NewsCategory = 'NOTICIAS' | 'PROXIMOS_JOGOS' | 'RETROSPECTO' | 'CURIOSIDADES';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  category: NewsCategory;
  publishedAt: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string;
  category: string;
  isPublic: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'nick' | 'email'> | null;
  action: string;
  module: string;
  description: string;
  ip?: string;
  createdAt: string;
}

// ── Caravanas ─────────────────────────────────────────────────────
export interface CaravanPhoto {
  id: string;
  caravanId: string;
  url: string;
  caption?: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface Caravan {
  id: string;
  title: string;
  description?: string;
  matchId?: string;
  match?: { homeTeam: string; awayTeam: string; matchDate: string; competition: string };
  departureCity: string;
  departurePoint: string;
  departureDatetime: string;
  returnDatetime?: string;
  price: number;
  capacity: number;
  spotsTaken: number;
  status: 'open' | 'full' | 'cancelled' | 'completed';
  contactWhatsapp?: string;
  contactName?: string;
  coverImage?: string;
  photos?: CaravanPhoto[];
  creator?: { fullName: string; nick: string };
  createdAt: string;
}

export interface GalleryPhoto {
  id: string;
  title?: string;
  description?: string;
  url: string;
  category: string;
  isFeatured: boolean;
  uploader?: { fullName: string; nick: string };
  createdAt: string;
}
