import { useState, useMemo, useEffect } from 'react';
import type { Trainee, GroupFilter, TeamMode, AlternatingMode, OrderMode, RoleAssignment, AppMode, EvalAssignment, TraineeStats } from './types';
import { filterTrainees, generateAssignments, splitIntoTeams } from './utils/assignRoles';
import { generateEvaluationAssignments } from './utils/evalAssign';
import { exportToExcel, printPage } from './utils/exportFile';
import FileUpload from './components/FileUpload';
import TraineeManager from './components/TraineeManager';
import RoleEditor from './components/RoleEditor';
import AssignmentTable from './components/AssignmentTable';
import EvaluationConfig from './components/EvaluationConfig';
import EvaluationTable from './components/EvaluationTable';
import EvaluationStats from './components/EvaluationStats';

const DEFAULT_ROLES = ['실습자', '예비', '상황판 작성', '평가표 작성 1', '평가표 작성 2'];

export default function App() {
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [teamMode, setTeamMode] = useState<TeamMode>('none');
  const [alternatingMode, setAlternatingMode] = useState<AlternatingMode>('none');
  const [orderMode, setOrderMode] = useState<OrderMode>('sequential');
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [totalRounds, setTotalRounds] = useState(10);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [generated, setGenerated] = useState(false);

  // 평가 조편성 상태
  const [mode, setMode] = useState<AppMode>('practice');
  const [evalAssignments, setEvalAssignments] = useState<EvalAssignment[]>([]);
  const [evalStats, setEvalStats] = useState<TraineeStats[]>([]);
  const [evalGenerated, setEvalGenerated] = useState(false);
  const [evalTotalRounds, setEvalTotalRounds] = useState(20);
  const [evalOrderMode, setEvalOrderMode] = useState<OrderMode>('sequential');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const filtered = useMemo(() => filterTrainees(trainees, groupFilter), [trainees, groupFilter]);

  const [team1, team2] = useMemo(() => {
    if (teamMode === 'split') return splitIntoTeams(filtered);
    return [filtered, [] as Trainee[]];
  }, [filtered, teamMode]);

  const warnings: string[] = useMemo(() => {
    const w: string[] = [];
    if (filtered.length === 0 && trainees.length > 0) {
      w.push('선택된 반에 해당하는 인원이 없습니다.');
    }
    if (roles.length === 0) {
      w.push('임무가 없습니다. 임무를 추가하세요.');
    }
    const active = teamMode === 'split' && alternatingMode === 'alternating' ? team1 : filtered;
    if (active.length > 0 && active.length < roles.length) {
      w.push(`인원(${active.length}명)이 임무(${roles.length}개)보다 적습니다. 일부 임무에 중복 배정될 수 있습니다.`);
    }
    return w;
  }, [filtered, roles, teamMode, alternatingMode, team1, trainees.length]);

  function generateEval() {
    const { assignments: a, stats: s } = generateEvaluationAssignments(trainees, evalTotalRounds, evalOrderMode);
    setEvalAssignments(a);
    setEvalStats(s);
    setEvalGenerated(true);
    setTimeout(() => {
      document.getElementById('eval-result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function generate() {
    const result = generateAssignments(trainees, roles, totalRounds, teamMode, alternatingMode, groupFilter, orderMode);
    setAssignments(result);
    setGenerated(true);
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm no-print">
        <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400 leading-tight">
                지휘역량 실습 임무 배정표
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Command Role Rotation</p>
            </div>
            <button
              onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
              aria-label="다크모드 전환"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          {/* 조편성 유형 선택 */}
          <div className="flex gap-2">
            {([['practice', '실습 조편성'], ['evaluation', '평가 조편성']] as [AppMode, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors border-2 ${
                  mode === val
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Section 0: 실습 조편성 결과 (최상단) */}
        {mode === 'practice' && generated && assignments.length > 0 && (
          <section id="result-section" className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 no-print">
              실습순서 ({assignments.length}회차)
            </h2>

            <div className="hidden print:block mb-4 text-center">
              <h1 className="text-xl font-bold">지휘역량 실습 임무 배정표</h1>
              <p className="text-sm text-gray-500">현장지휘 절차 XVR 실습 교육</p>
            </div>

            <AssignmentTable assignments={assignments} roles={roles} />

            <div className="flex gap-2 mt-5 no-print">
              <button
                onClick={printPage}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                🖨️ 인쇄
              </button>
              <button
                onClick={() => exportToExcel(assignments, roles)}
                className="flex-1 py-2.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium transition-colors"
              >
                📊 Excel 저장
              </button>
            </div>
          </section>
        )}

        {/* 평가 조편성 결과 */}
        {mode === 'evaluation' && evalGenerated && evalAssignments.length > 0 && (
          <section id="eval-result-section" className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 no-print">
              평가 배정 결과 ({evalAssignments.length}회차)
            </h2>

            <div className="hidden print:block mb-4 text-center">
              <h1 className="text-xl font-bold">지휘역량 평가 배정표</h1>
            </div>

            <EvaluationTable assignments={evalAssignments} />

            <div className="mt-6 no-print">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">교육생별 참여 통계</h3>
              <EvaluationStats stats={evalStats} totalRounds={evalTotalRounds} />
            </div>

            <div className="flex gap-2 mt-5 no-print">
              <button
                onClick={printPage}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                🖨️ 인쇄
              </button>
            </div>
          </section>
        )}

        {/* Section 1: File Upload */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 no-print">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
            1. 교육대상자 명단 불러오기
          </h2>
          <FileUpload onLoad={t => setTrainees(prev => [...prev, ...t])} />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            * 파일에서 자동 추출 후 아래에서 수동으로 수정할 수 있습니다.
          </p>
        </section>

        {/* Section 2: Trainee Management */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 no-print">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
            2. 교육대상자 관리
            {trainees.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                총 {trainees.length}명 (A반: {trainees.filter(t => t.group === 'A').length}, B반: {trainees.filter(t => t.group === 'B').length})
              </span>
            )}
          </h2>
          <TraineeManager trainees={trainees} onChange={setTrainees} />
        </section>

        {/* Section 3: 평가 조편성 설정 */}
        {mode === 'evaluation' && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 no-print">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">3. 평가 배정 설정</h2>
            <EvaluationConfig
              trainees={trainees}
              totalRounds={evalTotalRounds}
              orderMode={evalOrderMode}
              onRoundsChange={n => setEvalTotalRounds(n)}
              onOrderModeChange={setEvalOrderMode}
              onGenerate={generateEval}
            />
          </section>
        )}

        {/* Section 3: 실습 조편성 설정 */}
        {mode === 'practice' && (
        <section className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5 no-print">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">3. 배정 설정</h2>
          <div className="space-y-4">

            {/* Group Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">반 선택</span>
              <div className="flex gap-2">
                {(['all', 'A', 'B'] as GroupFilter[]).map(g => (
                  <button
                    key={g}
                    onClick={() => setGroupFilter(g)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      groupFilter === g
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {g === 'all' ? '전체' : g + '반'}
                  </button>
                ))}
              </div>
              {filtered.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length}명 대상</span>
              )}
            </div>

            {/* Team Mode */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">조 편성</span>
              <div className="flex gap-2">
                {([['none', '조 나누지 않음'], ['split', '조 나누기']] as [TeamMode, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => { setTeamMode(val); if (val === 'none') setAlternatingMode('none'); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      teamMode === val
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Team preview */}
            {teamMode === 'split' && filtered.length > 0 && (
              <div className="ml-28 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">1조 ({team1.length}명)</p>
                  <p className="text-gray-600 dark:text-gray-400">{team1.map(t => t.name).join(', ')}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                  <p className="font-semibold text-orange-700 dark:text-orange-300 mb-1">2조 ({team2.length}명)</p>
                  <p className="text-gray-600 dark:text-gray-400">{team2.map(t => t.name).join(', ')}</p>
                </div>
              </div>
            )}

            {/* Alternating Mode */}
            {teamMode === 'split' && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">교차진행</span>
                <div className="flex gap-2">
                  {([['none', '사용 안 함'], ['alternating', '교차진행']] as [AlternatingMode, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setAlternatingMode(val)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        alternatingMode === val
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {alternatingMode === 'alternating' && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">홀수회차: 1조 실습, 짝수회차: 2조 실습</span>
                )}
              </div>
            )}

            {/* Roles */}
            <div className="flex flex-wrap items-start gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 pt-1.5">임무 설정</span>
              <div className="flex-1 min-w-0">
                <RoleEditor roles={roles} onChange={setRoles} />
              </div>
            </div>

            {/* Total Rounds */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">총 회차 수</span>
              <input
                type="number"
                min={1}
                max={100}
                value={totalRounds}
                onChange={e => setTotalRounds(Math.max(1, Math.min(100, Number(e.target.value))))}
                className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">회차</span>
            </div>

            {/* Order Mode */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">배정 순서</span>
              <div className="flex gap-2">
                {([['sequential', '순차'], ['random', '랜덤']] as [OrderMode, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setOrderMode(val)}
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
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mt-4 space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-1">
                  <span>⚠️</span> {w}
                </p>
              ))}
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-5">
            <button
              onClick={generate}
              disabled={filtered.length === 0 || roles.length === 0}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors shadow-sm"
            >
              배정 생성
            </button>
          </div>
        </section>
        )}

      </main>

      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-600 no-print">
        현장지휘 절차 XVR 실습 교육 운영 도구 &middot; 브라우저에서만 동작 &middot; 데이터 저장 없음
      </footer>
    </div>
  );
}
