import type { TeamWithPlayers } from '../types';
import { MAX_PLAYERS_PER_TEAM } from '../utils/auction';

export const TEAM_BUDGET_CR = 120;
export const MIN_CUSTOM_TEAMS = 5;
export const MAX_CUSTOM_TEAMS = 30;

// Color palette for custom teams (primary, secondary) – used when creating 5–30 custom teams
const CUSTOM_TEAM_COLORS: [string, string][] = [
  ['#004ba0', '#a8b2c0'],
  ['#c9a227', '#8b6914'],
  ['#da121a', '#1a1a2e'],
  ['#3f1052', '#e1b32c'],
  ['#ea1a8c', '#004ba0'],
  ['#f26522', '#000000'],
  ['#004c93', '#7c3aed'],
  ['#b22222', '#d4a574'],
  ['#0d47a1', '#f7d358'],
  ['#8B1538', '#ff6b35'],
  ['#2e7d32', '#c8e6c9'],
  ['#6a1b9a', '#e1bee7'],
  ['#0277bd', '#b3e5fc'],
  ['#ef6c00', '#ffe0b2'],
  ['#00838f', '#b2ebf2'],
  ['#ad1457', '#f8bbd9'],
  ['#1565c0', '#bbdefb'],
  ['#558b2f', '#dcedc8'],
  ['#4527a0', '#d1c4e9'],
  ['#c62828', '#ffcdd2'],
  ['#283593', '#c5cae9'],
  ['#00695c', '#b2dfdb'],
  ['#6d4c41', '#d7ccc8'],
  ['#37474f', '#cfd8dc'],
  ['#795548', '#d7ccc8'],
  ['#455a64', '#b0bec5'],
  ['#5d4037', '#bcaaa4'],
  ['#263238', '#78909c'],
  ['#4e342e', '#d7ccc8'],
  ['#1b5e20', '#c8e6c9'],
];

/** Build custom teams from an array of team names (min 5, max 30). Uses full name for display (no shortening). */
export function buildCustomTeams(names: string[]): TeamWithPlayers[] {
  const count = Math.max(MIN_CUSTOM_TEAMS, Math.min(MAX_CUSTOM_TEAMS, names.length));
  return names.slice(0, count).map((name, index) => {
    const trimmed = name.trim() || `Team ${index + 1}`;
    const [primary, secondary] = CUSTOM_TEAM_COLORS[index % CUSTOM_TEAM_COLORS.length];
    return {
      id: `custom-${index + 1}`,
      name: trimmed,
      shortName: trimmed,
      primaryColor: primary,
      secondaryColor: secondary,
      maxPlayers: MAX_PLAYERS_PER_TEAM,
      budgetCr: TEAM_BUDGET_CR,
      players: [],
    };
  });
}

// Two-color gradient per team (primary → secondary), jersey-style
export const initialTeams: TeamWithPlayers[] = [
  { id: 't1', name: 'Mumbai Indians', shortName: 'MI', primaryColor: '#004ba0', secondaryColor: '#a8b2c0', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't2', name: 'Chennai Super Kings', shortName: 'CSK', primaryColor: '#c9a227', secondaryColor: '#8b6914', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't3', name: 'Royal Challengers Bengaluru', shortName: 'RCB', primaryColor: '#da121a', secondaryColor: '#1a1a2e', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't4', name: 'Kolkata Knight Riders', shortName: 'KKR', primaryColor: '#3f1052', secondaryColor: '#e1b32c', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't5', name: 'Rajasthan Royals', shortName: 'RR', primaryColor: '#ea1a8c', secondaryColor: '#004ba0', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't6', name: 'Sunrisers Hyderabad', shortName: 'SRH', primaryColor: '#f26522', secondaryColor: '#000000', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't7', name: 'Delhi Capitals', shortName: 'DC', primaryColor: '#004c93', secondaryColor: '#7c3aed', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't8', name: 'Punjab Kings', shortName: 'PBKS', primaryColor: '#b22222', secondaryColor: '#d4a574', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't9', name: 'Gujarat Titans', shortName: 'GT', primaryColor: '#0d47a1', secondaryColor: '#f7d358', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
  { id: 't10', name: 'Lucknow Super Giants', shortName: 'LSG', primaryColor: '#8B1538', secondaryColor: '#ff6b35', maxPlayers: MAX_PLAYERS_PER_TEAM, budgetCr: TEAM_BUDGET_CR, players: [] },
];