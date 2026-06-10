export interface Trainee {
  name: string;
  group: 'A' | 'B';
}

export type GroupFilter = 'all' | 'A' | 'B';
export type TeamMode = 'none' | 'split';
export type AlternatingMode = 'none' | 'alternating';
export type OrderMode = 'sequential' | 'random';

export interface RoleAssignment {
  round: number;
  activeTeam: string;
  supportTeam: string;
  assignments: Record<string, string>; // roleName -> traineeName
}

export type AppMode = 'practice' | 'evaluation';

export interface EvalAssignment {
  round: number;
  assessedGroup: 'A' | 'B';
  evaluatee: string;
  evaluators: [string, string, string];
}

export interface TraineeStats {
  name: string;
  group: 'A' | 'B';
  evaluateeCount: number;
  evaluatorCount: number;
  totalParticipations: number;
  lastParticipatedRound: number;
  lastEvaluatorRound: number;
}

export interface AppConfig {
  groupFilter: GroupFilter;
  teamMode: TeamMode;
  alternatingMode: AlternatingMode;
  roles: string[];
  totalRounds: number;
}
