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
  setId: string; // which auction set this player belongs to (e.g. marquee, batsmen)
  franchise?: string; // current IPL team shortName e.g. RCB, MI
  capped?: boolean; // capped or uncapped
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