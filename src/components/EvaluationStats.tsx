import { useState } from 'react';
import type { TraineeStats } from '../types';

interface Props {
  stats: TraineeStats[];
  totalRounds: number;
}

type SortKey = 'name' | 'evaluateeCount' | 'evaluatorCount' | 'totalParticipations' | 'lastParticipatedRound';

export default function EvaluationStats({ stats, totalRounds }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  const sorted = [...stats].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortKey === 'name') return dir * a.name.localeCompare(b.name, 'ko');
    return dir * (a[sortKey] - b[sortKey]);
  });

  function SortTh({ label, col }: { label: string; col: SortKey }) {
    const active = sortKey === col;
    return (
      <th
        onClick={() => toggleSort(col)}
        className="px-3 py-2.5 text-center font-semibold border-b border-gray-200 dark:border-gray-700 whitespace-nowrap cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {label}{active ? (sortAsc ? ' ▲' : ' ▼') : ''}
      </th>
    );
  }

  const groupAStats = sorted.filter(s => s.group === 'A');
  const groupBStats = sorted.filter(s => s.group === 'B');

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <SortTh label="반" col="name" />
              <SortTh label="이름" col="name" />
              <SortTh label="평가자 횟수" col="evaluateeCount" />
              <SortTh label="평가관 횟수" col="evaluatorCount" />
              <SortTh label="총 참여" col="totalParticipations" />
              <SortTh label="마지막 참여" col="lastParticipatedRound" />
            </tr>
          </thead>
          <tbody>
            {[...groupAStats, ...groupBStats].map((s) => {
              const isA = s.group === 'A';
              const rowStyle = { backgroundColor: isA ? '#EEF3FA' : '#FDF8E8' };
              const darkClass = isA ? 'dark:bg-[#1a2a40]' : 'dark:bg-[#2a2200]';
              const textStyle = { color: isA ? '#4A6FA5' : '#F0A500' };
              const evalOk = s.evaluateeCount >= 1;
              const evalorOk = s.evaluatorCount >= 3;

              return (
                <tr key={`${s.group}-${s.name}`} className={darkClass} style={rowStyle}>
                  <td className="px-3 py-2 text-center font-semibold whitespace-nowrap" style={textStyle}>
                    {s.group}반
                  </td>
                  <td className="px-3 py-2 text-center text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {s.name}
                  </td>
                  <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap ${evalOk ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {s.evaluateeCount}회
                  </td>
                  <td className={`px-3 py-2 text-center font-semibold whitespace-nowrap ${evalorOk ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {s.evaluatorCount}회
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {s.totalParticipations}회
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {s.lastParticipatedRound > 0 ? `${s.lastParticipatedRound}회차` : '미참여'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        * 평가자 1회 · 평가관 3회 달성 시 초록색 표시 / 총 {totalRounds}회차 기준
      </p>
    </div>
  );
}
