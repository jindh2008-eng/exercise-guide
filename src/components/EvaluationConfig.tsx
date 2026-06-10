import type { Trainee, OrderMode } from '../types';

interface Props {
  trainees: Trainee[];
  totalRounds: number;
  orderMode: OrderMode;
  onRoundsChange: (n: number) => void;
  onOrderModeChange: (m: OrderMode) => void;
  onGenerate: () => void;
}

export default function EvaluationConfig({ trainees, totalRounds, orderMode, onRoundsChange, onOrderModeChange, onGenerate }: Props) {
  const nA = trainees.filter(t => t.group === 'A').length;
  const nB = trainees.filter(t => t.group === 'B').length;

  const warnings: string[] = [];
  if (nA === 0) warnings.push('A반 교육생이 없습니다.');
  if (nB === 0) warnings.push('B반 교육생이 없습니다.');
  if (nA > 0 && nB < 3) warnings.push('B반이 3명 미만입니다. 평가관 3명 배정이 불가합니다.');
  if (nB > 0 && nA < 3) warnings.push('A반이 3명 미만입니다. 평가관 3명 배정이 불가합니다.');

  const canGenerate = nA > 0 && nB >= 3 && nA >= 3;

  return (
    <div className="space-y-4">
      {/* 반 현황 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
          <p className="font-semibold text-blue-700 dark:text-blue-300">A반</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{nA}명</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <p className="font-semibold text-amber-700 dark:text-amber-300">B반</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{nB}명</p>
        </div>
      </div>

      {/* 배정 규칙 안내 */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p>• A반 평가: A반 1명(평가자) + B반 3명(평가관)</p>
        <p>• B반 평가: B반 1명(평가자) + A반 3명(평가관)</p>
        <p>• 평가관 수행 후 최소 2회차 경과 후 평가자 가능</p>
        <p>• 목표: 모든 교육생 평가자 1회 · 평가관 3회</p>
      </div>

      {/* 총 회차 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">총 회차 수</span>
        <input
          type="number"
          min={1}
          max={100}
          value={totalRounds}
          onChange={e => onRoundsChange(Math.max(1, Math.min(100, Number(e.target.value))))}
          className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">회차</span>
        {nA > 0 && nB > 0 && (
          <button
            onClick={() => onRoundsChange(nA + nB)}
            className="text-xs text-blue-600 dark:text-blue-400 underline"
          >
            권장값({nA + nB}회차) 적용
          </button>
        )}
      </div>

      {/* 배정 순서 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">배정 순서</span>
        <div className="flex gap-2">
          {([['sequential', '순차'], ['random', '랜덤']] as [OrderMode, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => onOrderModeChange(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                orderMode === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {orderMode === 'random' && (
          <span className="text-xs text-gray-400 dark:text-gray-500">배정 생성 시마다 순서가 달라집니다</span>
        )}
      </div>

      {/* 경고 */}
      {warnings.map((w, i) => (
        <p key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-1">
          <span>⚠️</span> {w}
        </p>
      ))}

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors shadow-sm"
      >
        평가 배정 생성
      </button>
    </div>
  );
}
