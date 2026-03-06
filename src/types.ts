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
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  maxPlayers: number; // usually 25
}

export interface TeamWithPlayers extends Team {
  players: Player[];
}