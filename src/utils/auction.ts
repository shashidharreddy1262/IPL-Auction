import type { Player, TeamWithPlayers } from '../types';

export const MAX_PLAYERS_PER_TEAM = 25;

export function formatPriceCr(priceCr: number | undefined | null): string {
  if (priceCr == null) return '-';
  return `₹ ${priceCr.toFixed(2)} Cr`;
}

export function getNextBidIncrement(currentBidCr: number): number {
  if (currentBidCr < 5) {
    return 0.2; // 20 lakhs
  }
  if (currentBidCr >= 5 && currentBidCr < 10) {
    return 0.25; // 25 lakhs
  }
  return 0.5; // 50 lakhs
}

export function getNextBid(currentBidCr: number, basePriceCr: number): number {
  const effective = Math.max(currentBidCr, basePriceCr);
  return effective + getNextBidIncrement(effective);
}

export function canTeamBidForPlayer(team: TeamWithPlayers): boolean {
  return team.players.length < team.maxPlayers;
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