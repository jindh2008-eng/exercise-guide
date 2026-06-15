import type { Trainee, RoleAssignment, GroupFilter, TeamMode, AlternatingMode, OrderMode, GroupOrderModes } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pre-generate shuffled cycle bases so each cycle of `len` rounds gives each person each role exactly once
function makeCycleBases<T>(arr: T[], totalRounds: number): T[][] {
  const len = arr.length || 1;
  const numCycles = Math.ceil(totalRounds / len);
  return Array.from({ length: numCycles }, () => shuffle(arr));
}

function getOrdered<T>(bases: T[][], activeCount: number): T[] {
  const len = bases[0]?.length || 1;
  const cycleIdx = Math.floor((activeCount - 1) / len);
  const posInCycle = (activeCount - 1) % len;
  const base = bases[cycleIdx] ?? bases[bases.length - 1];
  return [...base.slice(posInCycle), ...base.slice(0, posInCycle)];
}

function getGroupMode(group: 'A' | 'B', fallback: OrderMode, groupOrderModes?: GroupOrderModes): OrderMode {
  return groupOrderModes?.[group] ?? fallback;
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
  orderMode: OrderMode = 'sequential',
  groupOrderModes?: GroupOrderModes
): RoleAssignment[] {
  const filtered = filterTrainees(trainees, groupFilter);
  const results: RoleAssignment[] = [];
  const isRandom = orderMode === 'random';

  if (teamMode === 'none' || filtered.length === 0) {
    const cycleBases = isRandom ? makeCycleBases(filtered, totalRounds) : null;

    for (let round = 1; round <= totalRounds; round++) {
      let ordered: Trainee[];
      if (groupFilter === 'all' && filtered.length > 0) {
        const groupA = filtered.filter(t => t.group === 'A');
        const groupB = filtered.filter(t => t.group === 'B');
        const aBases = getGroupMode('A', orderMode, groupOrderModes) === 'random' ? makeCycleBases(groupA, totalRounds) : null;
        const bBases = getGroupMode('B', orderMode, groupOrderModes) === 'random' ? makeCycleBases(groupB, totalRounds) : null;
        const orderedA = rotateByMode(groupA, round, getGroupMode('A', orderMode, groupOrderModes), aBases ?? undefined);
        const orderedB = rotateByMode(groupB, round, getGroupMode('B', orderMode, groupOrderModes), bBases ?? undefined);
        ordered = [...orderedA, ...orderedB];
      } else if (isRandom && cycleBases) {
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
      t1Bases = makeCycleBases(team1, Math.ceil(totalRounds / 2));
      t2Bases = makeCycleBases(team2, Math.floor(totalRounds / 2) || 1);
    } else {
      combinedBases = makeCycleBases([...team1, ...team2], totalRounds);
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
