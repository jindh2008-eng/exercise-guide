import type { Trainee, EvalAssignment, TraineeStats, OrderMode } from '../types';

interface PersonState {
  name: string;
  group: 'A' | 'B';
  evaluateeCount: number;
  evaluatorCount: number;
  totalParticipations: number;
  lastParticipatedRound: number;
  lastEvaluatorRound: number;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sortEvaluatee(pool: PersonState[], round: number): PersonState[] {
  return [...pool].sort((a, b) => {
    if (a.evaluateeCount !== b.evaluateeCount) return a.evaluateeCount - b.evaluateeCount;
    const aRecent = a.lastParticipatedRound > 0 && round - a.lastParticipatedRound <= 2;
    const bRecent = b.lastParticipatedRound > 0 && round - b.lastParticipatedRound <= 2;
    if (aRecent !== bRecent) return Number(aRecent) - Number(bRecent);
    const aExp = a.evaluatorCount > 0, bExp = b.evaluatorCount > 0;
    if (aExp !== bExp) return Number(bExp) - Number(aExp);
    return a.totalParticipations - b.totalParticipations;
  });
}

function sortEvaluator(pool: PersonState[], round: number): PersonState[] {
  return [...pool].sort((a, b) => {
    const aRecent = a.lastParticipatedRound > 0 && round - a.lastParticipatedRound <= 2;
    const bRecent = b.lastParticipatedRound > 0 && round - b.lastParticipatedRound <= 2;
    if (aRecent !== bRecent) return Number(aRecent) - Number(bRecent);
    if (a.evaluatorCount !== b.evaluatorCount) return a.evaluatorCount - b.evaluatorCount;
    return a.totalParticipations - b.totalParticipations;
  });
}

// Random selection: always pick from the minimum-count tier to ensure equal distribution
function randomEvaluatee(pool: PersonState[]): PersonState {
  const minCount = Math.min(...pool.map(s => s.evaluateeCount));
  const tier = pool.filter(s => s.evaluateeCount === minCount);
  return pickRandom(tier);
}

function randomEvaluators(pool: PersonState[]): PersonState[] {
  const selected: PersonState[] = [];
  const remaining = [...pool];
  for (let i = 0; i < 3 && remaining.length > 0; i++) {
    const minCount = Math.min(...remaining.map(s => s.evaluatorCount));
    const tier = remaining.filter(s => s.evaluatorCount === minCount);
    const chosen = pickRandom(tier);
    selected.push(chosen);
    remaining.splice(remaining.indexOf(chosen), 1);
  }
  return selected;
}

export function generateEvaluationAssignments(
  trainees: Trainee[],
  totalRounds: number,
  orderMode: OrderMode = 'sequential'
): { assignments: EvalAssignment[]; stats: TraineeStats[] } {
  const states = new Map<string, PersonState>();
  for (const t of trainees) {
    states.set(t.name, {
      name: t.name, group: t.group,
      evaluateeCount: 0, evaluatorCount: 0,
      totalParticipations: 0, lastParticipatedRound: 0, lastEvaluatorRound: 0,
    });
  }

  const groupA = trainees.filter(t => t.group === 'A');
  const groupB = trainees.filter(t => t.group === 'B');
  const assignments: EvalAssignment[] = [];
  const currentIsRandom = orderMode === 'random';

  for (let round = 1; round <= totalRounds; round++) {
    const assessedGroup: 'A' | 'B' = round % 2 === 1 ? 'A' : 'B';
    const assessedMembers = assessedGroup === 'A' ? groupA : groupB;
    const evaluatorMembers = assessedGroup === 'A' ? groupB : groupA;

    const toState = (members: Trainee[]) => members.map(t => states.get(t.name)!);

    const assessedPool = toState(assessedMembers);
    const evaluatee = currentIsRandom
      ? randomEvaluatee(assessedPool)
      : sortEvaluatee(assessedPool, round)[0];

    // 평가관 3명 선정
    const evaluatorPool = toState(evaluatorMembers);
    const selectedEvaluators = currentIsRandom
      ? randomEvaluators(evaluatorPool)
      : sortEvaluator(evaluatorPool, round).slice(0, 3);

    // 상태 업데이트
    const es = states.get(evaluatee.name)!;
    es.evaluateeCount++;
    es.totalParticipations++;
    es.lastParticipatedRound = round;

    for (const ev of selectedEvaluators) {
      ev.evaluatorCount++;
      ev.totalParticipations++;
      ev.lastParticipatedRound = round;
      ev.lastEvaluatorRound = round;
    }

    assignments.push({
      round,
      assessedGroup,
      evaluatee: evaluatee.name,
      evaluators: [
        selectedEvaluators[0]?.name ?? '—',
        selectedEvaluators[1]?.name ?? '—',
        selectedEvaluators[2]?.name ?? '—',
      ],
    });
  }

  const stats: TraineeStats[] = Array.from(states.values()).map(s => ({ ...s }));
  return { assignments, stats };
}
