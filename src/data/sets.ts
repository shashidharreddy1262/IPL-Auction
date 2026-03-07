import type { AuctionSet } from '../types';

// Set IDs set1–set25; names can be overridden by data (e.g. Set 1 – Marquee, Set 2 – Overseas batsman)
const SET_NAMES: Record<string, string> = {
  set1: 'Set 1 – Marquee players',
  set2: 'Set 2 – Overseas batsman',
  set3: 'Set 3',
  set4: 'Set 4',
  set5: 'Set 5',
  set6: 'Set 6',
  set7: 'Set 7',
  set8: 'Set 8',
  set9: 'Set 9',
  set10: 'Set 10',
  set11: 'Set 11',
  set12: 'Set 12',
  set13: 'Set 13',
  set14: 'Set 14',
  set15: 'Set 15',
  set16: 'Set 16',
  set17: 'Set 17',
  set18: 'Set 18',
  set19: 'Set 19',
  set20: 'Set 20',
  set21: 'Set 21',
  set22: 'Set 22',
  set23: 'Set 23',
  set24: 'Set 24',
  set25: 'Set 25',
};

export const auctionSets: AuctionSet[] = [
  ...Array.from({ length: 25 }, (_, i) => {
    const id = `set${i + 1}`;
    return { id, name: SET_NAMES[id] || `Set ${i + 1}` };
  }),
  { id: 'reauction', name: 'Re-auction (Unsold)' },
];

// When user selects Set 1 (set1), which player setId to show? Map dropdown ID → player setId.
// Existing player data uses setId 'marquee' and 'batsmen'; Set 1 = marquee, Set 2 = batsmen.
export const selectedSetIdToPlayerSetId: Record<string, string> = {
  reauction: 'reauction',
  set1: 'marquee',
  set2: 'batsmen',
  set3: 'set3',
  set4: 'set4',
  set5: 'set5',
  set6: 'set6',
  set7: 'set7',
  set8: 'set8',
  set9: 'set9',
  set10: 'set10',
  set11: 'set11',
  set12: 'set12',
  set13: 'set13',
  set14: 'set14',
  set15: 'set15',
  set16: 'set16',
  set17: 'set17',
  set18: 'set18',
  set19: 'set19',
  set20: 'set20',
  set21: 'set21',
  set22: 'set22',
  set23: 'set23',
  set24: 'set24',
  set25: 'set25',
};
