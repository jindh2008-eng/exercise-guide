import type { Trainee, RoleAssignment, GroupFilter, TeamMode, AlternatingMode, OrderMode } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pre-generate shuffled cycle bases so each cycle of `len` rounds gives each person each role exactly once.
// Avoids cross-epoch boundary collisions: the first round of epoch c+1 must not assign the
// same person to the same role they had in the last round of epoch c.
function makeCycleBases<T>(arr: T[], totalRounds: number, roleCount: number): T[][] {
  const N = arr.length || 1;
  const R = Math.min(roleCount, N);
  const numCycles = Math.ceil(totalRounds / N);
  const bases: T[][] = [];

  for (let c = 0; c < numCycles; c++) {
    const prevBase = bases[c - 1];
    let base: T[];

    if (!prevBase) {
      base = shuffle(arr);
    } else {
      // In the last round of the previous epoch (posInCycle = N-1),
      // role j was assigned to prevBase[(j + N - 1) % N].
      // In the first round of the new epoch (posInCycle = 0),
      // role j is assigned to newBase[j].
      // Collision when newBase[j] === prevBase[(j + N - 1) % N] for any j < R.
      const forbidden = Array.from({ length: R }, (_, j) => prevBase[(j + N - 1) % N]);
      let attempts = 0;
      do {
        base = shuffle(arr);
        attempts++;
      } while (attempts < 30 && forbidden.some((f, j) => base[j] === f));
    }

    bases.push(base);
  }

  return bases;
}

function getOrdered<T>(bases: T[][], activeCount: number): T[] {
  const len = bases[0]?.length || 1;
  const cycleIdx = Math.floor((activeCount - 1) / len);
  const posInCycle = (activeCount - 1) % len;
  const base = bases[cycleIdx] ?? bases[bases.length - 1];
  return [...base.slice(posInCycle), ...base.slice(0, posInCycle)];
}

function rotateByMode<T>(items: T[], round: number, orderMode: OrderMode, cycleBases?: T[][]): T[] {
  if (orderMode === 'random' && cycleBases) {
    return getOrdered(cycleBases, round);
  }
  const offset = (round - 1) % (items.length || 1);
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function filterTrainees(trainees: Trainee[], filter: GroupFilter): Trainee[] {
  if (filter === 'all') return trainees;
  return trainees.filter(t => t.group === filter);
}

export function splitIntoTeams(trainees: Trainee[]): [Trainee[], Trainee[]] {
  const half = Math.ceil(trainees.length / 2);
  return [trainees.slice(0, half), trainees.slice(half)];
}

export function generateAssignments(
  trainees: Trainee[],
  roles: string[],
  totalRounds: number,
  teamMode: TeamMode,
  alternatingMode: AlternatingMode,
  groupFilter: GroupFilter,
  orderMode: OrderMode = 'sequential'
): RoleAssignment[] {
  const filtered = filterTrainees(trainees, groupFilter);
  const results: RoleAssignment[] = [];
  const isRandom = orderMode === 'random';

  if (teamMode === 'none' || filtered.length === 0) {
    const cycleBases = isRandom ? makeCycleBases(filtered, totalRounds, roles.length) : null;

    for (let round = 1; round <= totalRounds; round++) {
      let ordered: Trainee[];
      if (isRandom && cycleBases) {
        ordered = getOrdered(cycleBases, round);
      } else {
        ordered = rotateByMode(filtered, round, orderMode);
      }
      const assignments: Record<string, string> = {};
      roles.forEach((role, i) => { assignments[role] = ordered[i % ordered.length]?.name ?? '—'; });
      results.push({ round, activeTeam: '전체', supportTeam: '', assignments });
    }
    return results;
  }

  const [team1, team2] = splitIntoTeams(filtered);
  const groupLabel = groupFilter === 'all' ? '' : groupFilter + '반-';

  // Pre-generate cycle bases per team (in random mode)
  let t1Bases: Trainee[][] | null = null;
  let t2Bases: Trainee[][] | null = null;
  let combinedBases: Trainee[][] | null = null;

  if (isRandom) {
    if (alternatingMode === 'alternating') {
      t1Bases = makeCycleBases(team1, Math.ceil(totalRounds / 2), roles.length);
      t2Bases = makeCycleBases(team2, Math.floor(totalRounds / 2) || 1, roles.length);
    } else {
      combinedBases = makeCycleBases([...team1, ...team2], totalRounds, roles.length);
    }
  }

  for (let round = 1; round <= totalRounds; round++) {
    let activeTeam: Trainee[];
    let activeLabel: string;
    let supportLabel: string;

    if (alternatingMode === 'alternating') {
      const isTeam1Active = round % 2 === 1;
      activeTeam = isTeam1Active ? team1 : team2;
      activeLabel = `${groupLabel}${isTeam1Active ? 1 : 2}조`;
      supportLabel = `${groupLabel}${isTeam1Active ? 2 : 1}조`;
    } else {
      activeTeam = [...team1, ...team2];
      activeLabel = '전체';
      supportLabel = '';
    }

    let ordered: Trainee[];
    if (isRandom) {
      if (alternatingMode === 'alternating') {
        const isTeam1Active = round % 2 === 1;
        // Both teams share the same active-count formula: Math.ceil(round/2)
        const activeCount = Math.ceil(round / 2);
        ordered = getOrdered(isTeam1Active ? t1Bases! : t2Bases!, activeCount);
      } else {
        ordered = getOrdered(combinedBases!, round);
      }
    } else {
      const activeRoundCount = alternatingMode === 'alternating' ? Math.ceil(round / 2) : round;
      const offset = (activeRoundCount - 1) % (activeTeam.length || 1);
      ordered = [...activeTeam.slice(offset), ...activeTeam.slice(0, offset)];
    }

    const assignments: Record<string, string> = {};
    roles.forEach((role, i) => { assignments[role] = ordered[i % ordered.length]?.name ?? '—'; });

    results.push({ round, activeTeam: activeLabel, supportTeam: supportLabel, assignments });
  }

  return results;
}
