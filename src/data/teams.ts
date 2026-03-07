import type { TeamWithPlayers } from '../types';
import { MAX_PLAYERS_PER_TEAM } from '../utils/auction';

export const TEAM_BUDGET_CR = 120;

export const initialTeams: TeamWithPlayers[] = [
  { id: 't1', name: 'Mumbai Indians', shortName: 'MI', primaryColor: '#004ba0', secondaryColor: '#ffcc29', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't2', name: 'Chennai Super Kings', shortName: 'CSK', primaryColor: '#1d428a', secondaryColor: '#f9cd05', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't3', name: 'Royal Challengers Bengaluru', shortName: 'RCB', primaryColor: '#da121a', secondaryColor: '#ffffff', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't4', name: 'Kolkata Knight Riders', shortName: 'KKR', primaryColor: '#3f1052', secondaryColor: '#e1b32c', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't5', name: 'Rajasthan Royals', shortName: 'RR', primaryColor: '#ea1a8c', secondaryColor: '#004ba0', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't6', name: 'Sunrisers Hyderabad', shortName: 'SRH', primaryColor: '#f26522', secondaryColor: '#ffffff', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't7', name: 'Delhi Capitals', shortName: 'DC', primaryColor: '#004c93', secondaryColor: '#e31b23', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't8', name: 'Punjab Kings', shortName: 'PBKS', primaryColor: '#d71920', secondaryColor: '#ffffff', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't9', name: 'Gujarat Titans', shortName: 'GT', primaryColor: '#1c2833', secondaryColor: '#f7d358', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't10', name: 'Lucknow Super Giants', shortName: 'LSG', primaryColor: '#00519c', secondaryColor: '#ff7f32', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
];