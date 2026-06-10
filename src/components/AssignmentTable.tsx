import { useState } from 'react';
import type { RoleAssignment } from '../types';

interface Props {
  assignments: RoleAssignment[];
  roles: string[];
}

export default function AssignmentTable({ assignments, roles }: Props) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="no-print space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">회차 선택</p>
          <button
            onClick={() => {
              const rounds = assignments.map(a => a.round);
              const cur = selectedRound ?? rounds[rounds.length - 1] + 1;
              const prev = rounds.filter(r => r < cur).at(-1);
              if (prev !== undefined) setSelectedRound(prev);
            }}
            disabled={selectedRound === assignments[0]?.round}
            className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
            aria-label="이전 회차"
          >
            ◀
          </button>
          <button
            onClick={() => {
              const rounds = assignments.map(a => a.round);
              const cur = selectedRound ?? rounds[0] - 1;
              const next = rounds.find(r => r > cur);
              if (next !== undefined) setSelectedRound(next);
            }}
            disabled={selectedRound === assignments[assignments.length - 1]?.round}
            className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
            aria-label="다음 회차"
          >
            ▶
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {assignments.map(a => {
            const selected = selectedRound === a.round;
            return (
              <button
                key={a.round}
                onClick={() => setSelectedRound(selected ? null : a.round)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {a.round}회차
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <th className="px-3 py-2.5 text-center font-semibold border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">회차</th>
              <th className="px-3 py-2.5 text-center font-semibold border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">실습조</th>
              {assignments.some(a => a.supportTeam) && (
                <th className="px-3 py-2.5 text-center font-semibold border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">쉐도잉</th>
              )}
              {roles.map(role => (
                <th key={role} className="px-3 py-2.5 text-center font-semibold border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assignments.filter(a => selectedRound === null || a.round >= selectedRound).map((a) => {
              const isTeam1 = a.activeTeam.endsWith('1조');
              const isTeam2 = a.activeTeam.endsWith('2조');
              const isSelected = selectedRound === a.round;

              const rowStyle = isTeam1
                ? { backgroundColor: '#EEF3FA' }
                : isTeam2
                  ? { backgroundColor: '#FDF8E8' }
                  : {};
              const rowDarkClass = isTeam1
                ? 'dark:bg-[#1a2a40]'
                : isTeam2
                  ? 'dark:bg-[#2a2200]'
                  : 'dark:bg-gray-900';
              const teamTextStyle = isTeam1
                ? { color: '#4A6FA5' }
                : isTeam2
                  ? { color: '#F0A500' }
                  : {};
              const shadowTextStyle = isTeam1
                ? { color: '#F0A500' }
                : isTeam2
                  ? { color: '#4A6FA5' }
                  : {};

              return (
                <tr
                  key={a.round}
                  className={`${rowDarkClass} transition-all ${
                    isSelected ? 'outline outline-2 outline-blue-500 relative' : ''
                  }`}
                  style={rowStyle}
                  onClick={() => setSelectedRound(isSelected ? null : a.round)}
                >
                  <td className={`px-3 py-2 text-center font-medium whitespace-nowrap ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {a.round}회차
                  </td>
                  <td className="px-3 py-2 text-center font-semibold whitespace-nowrap" style={teamTextStyle}>
                    {a.activeTeam}
                  </td>
                  {assignments.some(x => x.supportTeam) && (
                    <td className="px-3 py-2 text-center font-semibold whitespace-nowrap" style={shadowTextStyle}>
                      {a.supportTeam || '—'}
                    </td>
                  )}
                  {roles.map(role => (
                    <td key={role} className="px-3 py-2 text-center text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {a.assignments[role] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
