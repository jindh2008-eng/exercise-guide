import type { Trainee, OrderMode } from '../types';

interface Props {
  trainees: Trainee[];
  totalRounds: number;
  orderMode: OrderMode;
  onRoundsChange: (n: number) => void;
  onOrderModeChange: (m: OrderMode) => void;
  onGenerate: () => void;
}

function OrderModeButtons({ value, onChange }: { value: OrderMode; onChange: (mode: OrderMode) => void; }) {
  return (
    <div className="flex gap-1.5">
      {([['sequential', '순차'], ['random', '랜덤']] as [OrderMode, string][]).map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={`pill ${
            value === val
              ? 'pill-active'
              : 'pill-inactive'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
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
    <div className="space-y-5">
      {/* 반 현황 */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-xl p-3.5 text-center border border-blue-100 dark:border-blue-800/30">
          <p className="font-bold text-blue-600 dark:text-blue-300 text-xs tracking-wide">A반</p>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">{nA}<span className="text-sm font-semibold ml-0.5">명</span></p>
        </div>
        <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-xl p-3.5 text-center border border-amber-100 dark:border-amber-800/30">
          <p className="font-bold text-amber-600 dark:text-amber-300 text-xs tracking-wide">B반</p>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{nB}<span className="text-sm font-semibold ml-0.5">명</span></p>
        </div>
      </div>

      {/* 배정 규칙 안내 */}
      <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1.5 border border-slate-100 dark:border-gray-700/50">
        <p className="font-semibold text-gray-700 dark:text-gray-300 text-[11px] tracking-wide mb-2">배정 규칙</p>
        <p>• A반 평가: A반 1명(평가자) + B반 3명(평가관)</p>
        <p>• B반 평가: B반 1명(평가자) + A반 3명(평가관)</p>
        <p>• 평가관 수행 후 최소 2회차 경과 후 평가자 가능</p>
        <p>• 목표: 모든 교육생 평가자 1회 · 평가관 3회</p>
      </div>

      {/* 총 회차 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-24">총 회차 수</span>
        <input
          type="number"
          min={1}
          max={100}
          value={totalRounds}
          onChange={e => onRoundsChange(Math.max(1, Math.min(100, Number(e.target.value))))}
          className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm text-center font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        <span className="text-sm text-gray-400 dark:text-gray-500">회차</span>
        {nA > 0 && nB > 0 && (
          <button
            onClick={() => onRoundsChange(nA + nB)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            권장값({nA + nB}회차) 적용
          </button>
        )}
      </div>

      {/* 배정순서 */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 w-24">배정순서</span>
        <OrderModeButtons value={orderMode} onChange={onOrderModeChange} />
      </div>

      {/* 경고 */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30">
              <span className="text-amber-500 text-xs mt-0.5">&#9888;</span>
              <span className="text-sm text-amber-700 dark:text-amber-400">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* 생성 버튼 */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate}
        className="btn-primary"
      >
        평가 배정 생성
      </button>
    </div>
  );
}
