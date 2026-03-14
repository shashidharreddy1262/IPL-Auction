export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';

export type PlayerStatus = 'available' | 'live' | 'sold' | 'unsold';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  country: string;
  basePriceCr: number; // price stored in crores
  status: PlayerStatus;
  soldPriceCr?: number;
  soldToTeamId?: string;
  setId: string; // which auction set this player belongs to (from set_number / set_contains in DB)
  franchise?: string; // current IPL team shortName e.g. RCB, MI (from DB franchise)
  capped?: boolean; // capped or uncapped (from DB capped)
}

/** Raw player shape from backend DB /api/players (snake_case or camelCase) */
export interface PlayerFromApi {
  id?: number | string;
  name?: string;
  role?: string;
  country?: string;
  base_price_cr?: number;
  basePriceCr?: number;
  status?: string;
  franchise?: string;
  capped?: number | boolean;
  set_number?: number;
  set_contains?: string;
  setNumber?: number;
  setContains?: string;
  setId?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  maxPlayers: number; // usually 25
  budgetCr: number; // total purse, e.g. 120
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}

export interface AuctionSet {
  id: string;
  name: string;
}

export type AuctionPhase = 'idle' | 'running' | 'paused';