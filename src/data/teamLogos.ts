// Map team shortName (lowercase) to logo URL for use in TeamCard etc.
import mi from '../ipl logos/mi.avif';
import csk from '../ipl logos/csk.avif';
import rcb from '../ipl logos/rcb.avif';
import kkr from '../ipl logos/kkr.avif';
import rr from '../ipl logos/rr.avif';
import srh from '../ipl logos/srh.avif';
import dc from '../ipl logos/dc.avif';
import pbks from '../ipl logos/pbks.avif';
import gt from '../ipl logos/gt.avif';
import lsg from '../ipl logos/lsg.avif';

export const teamLogoMap: Record<string, string> = {
  mi,
  csk,
  rcb,
  kkr,
  rr,
  srh,
  dc,
  pbks,
  gt,
  lsg,
};

export function getTeamLogoUrl(shortName: string): string | undefined {
  return teamLogoMap[shortName.toLowerCase()];
}
