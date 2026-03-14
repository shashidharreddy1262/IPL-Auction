import type { Player, TeamWithPlayers } from '../types';

export const MAX_PLAYERS_PER_TEAM = 25;

export function formatPriceCr(priceCr: number | undefined | null): string {
  if (priceCr == null || !Number.isFinite(priceCr)) return '-';
  return `₹ ${priceCr.toFixed(2)} Cr`;
}

export function getNextBidIncrement(currentBidCr: number): number {
  if (currentBidCr < 1) {
    return 0.05; // 5 lakhs
  }
  if (currentBidCr >= 1 && currentBidCr < 5) {
    return 0.1; // 10 lakhs
  }
  if (currentBidCr >= 5 && currentBidCr < 10) {
    return 0.2; // 20 lakhs
  }
  return 0.25; // 25 lakhs
}

export function getNextBid(currentBidCr: number | null, basePriceCr: number): number {
  // If no bid yet, the first bid IS the base price
  if (currentBidCr == null || currentBidCr < basePriceCr) return basePriceCr;
  return currentBidCr + getNextBidIncrement(currentBidCr);
}

export function canTeamBidForPlayer(team: TeamWithPlayers): boolean {
  return team.players.length < team.maxPlayers;
}

export function getRemainingPurseCr(team: TeamWithPlayers): number {
  const spent = team.players.reduce((sum, p) => sum + (p.soldPriceCr ?? 0), 0);
  return team.budgetCr - spent;
}

export function canTeamAfford(team: TeamWithPlayers, priceCr: number): boolean {
  return getRemainingPurseCr(team) >= priceCr;
}

export function movePlayerToTeam(
  teams: TeamWithPlayers[],
  player: Player,
  teamId: string,
  soldPriceCr: number
): TeamWithPlayers[] {
  return teams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          players: [
            ...team.players,
            {
              ...player,
              status: 'sold',
              soldToTeamId: teamId,
              soldPriceCr,
            },
          ],
        }
      : team
  );
}