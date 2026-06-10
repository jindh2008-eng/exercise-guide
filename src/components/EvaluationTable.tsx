import { useState } from 'react';
import type { EvalAssignment } from '../types';

const A_TEXT = '#4A6FA5';
const B_TEXT = '#F0A500';
const A_BG = '#EEF3FA';
const B_BG = '#FDF8E8';
const A_BG_DARK = '#1a2a40';
const B_BG_DARK = '#2a2200';

interface Props {
  assignments: EvalAssignment[];
}

export default function EvaluationTable({ assignments }: Props) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const displayed = assignments.filter(a => selectedRound === null || a.round >= selectedRound);

  return (
    <div className="space-y-3">
      {/* 회차 선택 버튼 */}
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
          >◀</button>
          <button
            onClick={() => {
              const rounds = assignments.map(a => a.round);
              const cur = selectedRound ?? rounds[0] - 1;
              const next = rounds.find(r => r > cur);
              if (next !== undefined) setSelectedRound(next);
            }}
            disabled={selectedRound === assignments[assignments.length - 1]?.round}
            className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-400"
          >▶</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {assignments.map(a => {
            const selected = selectedRound === a.round;
            const color = a.assessedGroup === 'A' ? A_TEXT : B_TEXT;
            return (
              <button
                key={a.round}
                onClick={() => setSelectedRound(selected ? null : a.round)}
                style={selected ? { borderColor: color, backgroundColor: a.assessedGroup === 'A' ? A_BG : B_BG, color } : {}}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  selected
                    ? ''
                    : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                {a.round}회차
              </button>
            );
          })}
        </div>
      </div>

      {/* 결과 테이블 */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {['회차', '평가반', '평가자', '평가관1', '평가관2', '평가관3'].map(h => (
                <th key={h} className="px-3 py-2.5 text-center font-semibold border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map(a => {
              const isA = a.assessedGroup === 'A';
              const selected = selectedRound === a.round;
              const rowStyle = { backgroundColor: isA ? A_BG : B_BG };
              const darkClass = isA ? `dark:bg-[${A_BG_DARK}]` : `dark:bg-[${B_BG_DARK}]`;
              const textStyle = { color: isA ? A_TEXT : B_TEXT };

              return (
                <tr
                  key={a.round}
                  className={`${darkClass} transition-all cursor-pointer ${
                    selected ? 'outline outline-2 outline-blue-500' : ''
                  }`}
                  style={rowStyle}
                  onClick={() => setSelectedRound(selected ? null : a.round)}
                >
                  <td className={`px-3 py-2 text-center font-medium whitespace-nowrap ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {a.round}회차
                  </td>
                  <td className="px-3 py-2 text-center font-semibold whitespace-nowrap" style={textStyle}>
                    {a.assessedGroup}반
                  </td>
                  <td className="px-3 py-2 text-center font-semibold whitespace-nowrap" style={textStyle}>
                    {a.evaluatee}
                  </td>
                  {a.evaluators.map((ev, i) => (
                    <td key={i} className="px-3 py-2 text-center text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {ev}
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
