// ==========================================
// TYPES DE BASE
// ==========================================

export interface Team {
  id: string;
  name: string;
}

export interface Pool {
  id: string;
  name: string;
  teamIds: string[];
}

export interface Match {
  id: string;
  poolId?: string;
  a: string;
  b: string;
  sa: number | null;
  sb: number | null;
  done: boolean;
}

export interface BracketMatch {
  id: string;
  a: string | null;
  b: string | null;
  sa: number | null;
  sb: number | null;
  done: boolean;
  winner: string | null;
  bye: boolean;
}

export interface Bracket {
  name: string;
  prefix: string;
  size: number;
  slots: (string | null)[];
  scores: Record<string, { sa: number; sb: number }>;
  rounds: BracketMatch[][];
  thirdPlaceMatch?: BracketMatch | null;
}

export interface Target {
  id: string;
  label: string;
  matchId: string | null;
  defaultPoolId?: string | null; // 👈 AJOUT
}

// ==========================================
// STATISTIQUES
// ==========================================

export interface TeamStat {
  id: string;
  name: string;
  played: number;
  w: number;
  l: number;
  lf: number;
  la: number;
  pts: number;
  form: ('V' | 'D')[];
}

// ==========================================
// ÉTAT GLOBAL DU TOURNOI
// ==========================================

export interface TournamentState {
  // ----- Données -----
  teams: Team[];
  pools: Pool[];
  poolMatches: Match[];
  mainBracket: Bracket | null;
  consBracket: Bracket | null;
  targets: Target[];
  config: {
    poolSize: number;
    qualifyCount: number;
    legsToWinPool: number;
    legsToWinMain: number;
    legsToWinCons: number;
    targetCount: number;
  };
  manualQualification: Record<string, 'main' | 'cons'>;
  
  // 👇 NOUVELLES DONNÉES D'EN-TÊTE 👇
  appTitle: string;
  appSubtitle: string;
  appLogo: string | null;

  // ----- Actions Joueurs -----
  addTeam: (name: string) => void;
  removeTeam: (id: string) => void;
  moveTeam: (id: string, dir: number) => void;
  setTeamNumber: (id: string, num: number) => void;
  movePlayerToPool: (playerId: string, targetPoolId: string | null) => void;

  // ----- Actions Configuration -----
  setConfig: (key: string, value: number) => void;
  setManualQualification: (teamId: string, target: 'main' | 'cons' | null) => void;
  
  // 👇 NOUVELLES ACTIONS 👇
  setAppTitle: (title: string) => void;
  setAppSubtitle: (subtitle: string) => void;
  setAppLogo: (logo: string | null) => void;
  setTargetDefaultPool: (targetId: string, poolId: string | null) => void;

  // ----- Actions Cibles -----
  addTarget: () => void;
  removeTarget: (id: string) => void;
  updateTargetLabel: (id: string, label: string) => void;
  assignTarget: (targetId: string, matchId: string | null) => void;
  autoAssignTargets: () => void;
  // ----- Actions Tournoi -----
  generatePools: () => void;
  generateFinals: () => void;
  generateDemo: () => void;

  // ----- Actions Scores -----
  commitScore: (matchId: string, sa: number, sb: number) => void;
  clearMatch: (matchId: string) => void;

  // ----- Actions Arbre de Tournoi -----
  swapBracketSlots: (brKey: 'main' | 'cons', idxA: number, idxB: number) => void;

  // ----- Actions Stats -----
  getGlobalStats: () => TeamStat[];

  // ----- Reset -----
  resetTournament: () => void;
}