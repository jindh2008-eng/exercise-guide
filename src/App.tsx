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

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: 'blue' | 'indigo' | 'amber' | 'emerald' | 'slate' }) {
  const styles = {
    blue:    'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40',
    indigo:  'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-800/40',
    amber:   'bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40',
    slate:   'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40',
  };
  const textStyles = {
    blue:    'text-blue-700 dark:text-blue-400',
    indigo:  'text-indigo-700 dark:text-indigo-400',
    amber:   'text-amber-700 dark:text-amber-400',
    emerald: 'text-emerald-700 dark:text-emerald-400',
    slate:   'text-slate-700 dark:text-slate-300',
  };
  return (
    <div className={`stat-card ${styles[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${textStyles[color]}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function PanelSection({ icon, iconBg, title, badge, children, defaultOpen = true, noPrint }: {
  icon: string; iconBg: string; title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean; noPrint?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`dash-card ${noPrint ? 'no-print' : ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="panel-header w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
      >
        <div className={`panel-icon ${iconBg}`}>{icon}</div>
        <span className="panel-title flex-1">{title}</span>
        {badge && (
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{badge}</span>
        )}
        <span className={`text-gray-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>&#9662;</span>
      </button>
      {open && <div className="panel-body">{children}</div>}
    </div>
  );
}

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

  useEffect(() => {
    if (filtered.length > 0) setTotalRounds(filtered.length);
  }, [filtered.length]);

  useEffect(() => {
    if (trainees.length > 0) setEvalTotalRounds(trainees.length);
  }, [trainees.length]);

  const [team1, team2] = useMemo(() => {
    if (teamMode === 'split') return splitIntoTeams(filtered);
    return [filtered, [] as Trainee[]];
  }, [filtered, teamMode]);

  const nA = trainees.filter(t => t.group === 'A').length;
  const nB = trainees.filter(t => t.group === 'B').length;

  const warnings: string[] = useMemo(() => {
    const w: string[] = [];
    if (filtered.length === 0 && trainees.length > 0) w.push('선택된 반에 해당하는 인원이 없습니다.');
    if (roles.length === 0) w.push('임무가 없습니다. 임무를 추가하세요.');
    const active = teamMode === 'split' && alternatingMode === 'alternating' ? team1 : filtered;
    if (active.length > 0 && active.length < roles.length) w.push(`인원(${active.length}명)이 임무(${roles.length}개)보다 적습니다.`);
    return w;
  }, [filtered, roles, teamMode, alternatingMode, team1, trainees.length]);

  function generateEval() {
    const { assignments: a, stats: s } = generateEvaluationAssignments(trainees, evalTotalRounds, evalOrderMode);
    setEvalAssignments(a);
    setEvalStats(s);
    setEvalGenerated(true);
    setTimeout(() => document.getElementById('eval-result-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function generate() {
    const result = generateAssignments(trainees, roles, totalRounds, teamMode, alternatingMode, groupFilter, orderMode);
    setAssignments(result);
    setGenerated(true);
    setTimeout(() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  const hasResult = mode === 'practice' ? (generated && assignments.length > 0) : (evalGenerated && evalAssignments.length > 0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">

      {/* ── Header ── */}
      <header className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950 no-print overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/8 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-lg">
                <span className="text-xl">🔥</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-300/70 tracking-[0.2em] uppercase">Gangwon ICTC</span>
                  <span className="w-px h-3 bg-blue-400/30" />
                  <span className="text-[10px] text-blue-400/50">Incident Command Training Center</span>
                </div>
                <h1 className="text-lg font-extrabold text-white tracking-tight leading-tight mt-0.5">
                  현장지휘관 XVR실습 순서
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-white/8 backdrop-blur-sm rounded-xl p-0.5 border border-white/10">
                {([['practice', '실습'], ['evaluation', '평가']] as [AppMode, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setMode(val)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === val
                        ? 'bg-white text-slate-900 shadow-md'
                        : 'text-blue-200/70 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDarkMode(d => !d)}
                className="p-2 rounded-xl bg-white/8 hover:bg-white/15 backdrop-blur-sm border border-white/10 transition-all text-sm"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-5 space-y-5">

        {/* ── Stats Dashboard ── */}
        <section className="no-print">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="전체 교육생" value={trainees.length} sub={trainees.length > 0 ? `${nA + nB}명 등록` : '미등록'} color="slate" />
            <StatCard label="A반" value={`${nA}명`} sub={nA > 0 ? `${((nA / (trainees.length || 1)) * 100).toFixed(0)}%` : '—'} color="blue" />
            <StatCard label="B반" value={`${nB}명`} sub={nB > 0 ? `${((nB / (trainees.length || 1)) * 100).toFixed(0)}%` : '—'} color="amber" />
            <StatCard
              label={mode === 'practice' ? '실습 회차' : '평가 회차'}
              value={`${mode === 'practice' ? totalRounds : evalTotalRounds}회`}
              sub={hasResult ? '생성 완료' : '대기중'}
              color={hasResult ? 'emerald' : 'indigo'}
            />
          </div>
        </section>

        {/* ── Course Info Strip ── */}
        <section className="no-print">
          <div className="dash-card px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="field-label">과정</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">현장지휘관 XVR 실습</span>
            </div>
            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="field-label">기관</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">강원ICTC</span>
            </div>
            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="field-label">유형</span>
              <span className={`font-bold ${mode === 'practice' ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400'}`}>
                {mode === 'practice' ? '실습 조편성' : '평가 조편성'}
              </span>
            </div>
            <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="field-label">임무</span>
              <span className="text-gray-500 dark:text-gray-400">{roles.length}개</span>
              <span className="text-gray-400 dark:text-gray-500">({roles.slice(0, 3).join(', ')}{roles.length > 3 ? ` 외 ${roles.length - 3}개` : ''})</span>
            </div>
          </div>
        </section>

        {/* ── Results (shown at top when generated) ── */}
        {mode === 'practice' && generated && assignments.length > 0 && (
          <section id="result-section" className="dash-card">
            <div className="panel-header no-print">
              <div className="panel-icon bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">✓</div>
              <span className="panel-title flex-1">배정 결과</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                {assignments.length}회차 완료
              </span>
            </div>
            <div className="hidden print:block py-4 text-center border-b border-gray-200">
              <p className="text-[10px] text-gray-400 tracking-[0.3em] uppercase">강원 ICTC</p>
              <h1 className="text-xl font-bold mt-1">현장지휘관 XVR실습 순서</h1>
            </div>
            <div className="p-5">
              <AssignmentTable assignments={assignments} roles={roles} />
              <div className="flex gap-3 mt-5 no-print">
                <button onClick={printPage} className="btn-secondary flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                  🖨️ 인쇄
                </button>
                <button onClick={() => exportToExcel(assignments, roles)} className="btn-secondary flex-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30">
                  📊 Excel 저장
                </button>
              </div>
            </div>
          </section>
        )}

        {mode === 'evaluation' && evalGenerated && evalAssignments.length > 0 && (
          <section id="eval-result-section" className="dash-card">
            <div className="panel-header no-print">
              <div className="panel-icon bg-violet-100 dark:bg-violet-900/30 text-violet-600">✓</div>
              <span className="panel-title flex-1">평가 배정 결과</span>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-full">
                {evalAssignments.length}회차 완료
              </span>
            </div>
            <div className="hidden print:block py-4 text-center border-b border-gray-200">
              <p className="text-[10px] text-gray-400 tracking-[0.3em] uppercase">강원 ICTC</p>
              <h1 className="text-xl font-bold mt-1">현장지휘관 XVR 평가 배정표</h1>
            </div>
            <div className="p-5">
              <EvaluationTable assignments={evalAssignments} />
              <div className="mt-6 no-print">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-violet-500" />
                  교육생별 참여 통계
                </h3>
                <EvaluationStats stats={evalStats} totalRounds={evalTotalRounds} />
              </div>
              <div className="flex gap-3 mt-5 no-print">
                <button onClick={printPage} className="btn-secondary flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                  🖨️ 인쇄
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Main Content: 2-column dashboard ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 no-print">

          {/* Left Column: 교육생 관리 (3/5) */}
          <div className="lg:col-span-3 space-y-5">
            <PanelSection
              icon="📂"
              iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
              title="교육대상자 명단"
              badge={trainees.length > 0 ? `${trainees.length}명` : undefined}
              noPrint
            >
              <FileUpload onLoad={t => setTrainees(prev => [...prev, ...t])} />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                PDF / Excel / CSV 파일에서 명단을 자동 추출합니다.
              </p>
            </PanelSection>

            <PanelSection
              icon="👥"
              iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
              title="교육생 현황"
              badge={trainees.length > 0 ? `A${nA} / B${nB}` : undefined}
              noPrint
            >
              <TraineeManager trainees={trainees} onChange={setTrainees} />
            </PanelSection>
          </div>

          {/* Right Column: 설정 (2/5) */}
          <div className="lg:col-span-2 space-y-5">

            {/* 과정 요약 미니 카드 */}
            {trainees.length > 0 && (
              <div className="dash-card p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="panel-icon bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">📋</div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">교육 준비 상태</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: '교육생 등록', ok: trainees.length > 0, detail: `${trainees.length}명` },
                    { label: 'A/B반 배정', ok: nA > 0 && nB > 0, detail: `A${nA} / B${nB}` },
                    { label: '임무 설정', ok: roles.length > 0, detail: `${roles.length}개` },
                    { label: '회차 설정', ok: (mode === 'practice' ? totalRounds : evalTotalRounds) > 0, detail: `${mode === 'practice' ? totalRounds : evalTotalRounds}회` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                      </div>
                      <span className={`font-semibold ${item.ok ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>{item.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">전체 준비도</span>
                    <span className={`font-bold ${trainees.length > 0 && nA > 0 && nB > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                      {trainees.length > 0 && nA > 0 && nB > 0 ? '준비 완료' : '설정 필요'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${[trainees.length > 0, nA > 0, nB > 0, roles.length > 0].filter(Boolean).length * 25}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 평가 모드 설정 */}
            {mode === 'evaluation' && (
              <PanelSection
                icon="⚙️"
                iconBg="bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                title="평가 배정 설정"
                noPrint
              >
                <EvaluationConfig
                  trainees={trainees}
                  totalRounds={evalTotalRounds}
                  orderMode={evalOrderMode}
                  onRoundsChange={n => setEvalTotalRounds(n)}
                  onOrderModeChange={setEvalOrderMode}
                  onGenerate={generateEval}
                />
              </PanelSection>
            )}

            {/* 실습 모드 설정 */}
            {mode === 'practice' && (
              <PanelSection
                icon="⚙️"
                iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                title="배정 설정"
                noPrint
              >
                <div className="space-y-4">
                  {/* 반 선택 */}
                  <div>
                    <p className="field-label mb-2">반 선택</p>
                    <div className="flex gap-1.5">
                      {(['all', 'A', 'B'] as GroupFilter[]).map(g => (
                        <button key={g} onClick={() => setGroupFilter(g)} className={`pill ${groupFilter === g ? 'pill-active' : 'pill-inactive'}`}>
                          {g === 'all' ? '전체' : g + '반'}
                        </button>
                      ))}
                      {filtered.length > 0 && (
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full self-center">{filtered.length}명</span>
                      )}
                    </div>
                  </div>

                  {/* 조 편성 */}
                  <div>
                    <p className="field-label mb-2">조 편성</p>
                    <div className="flex gap-1.5">
                      {([['none', '나누지 않음'], ['split', '조 나누기']] as [TeamMode, string][]).map(([val, label]) => (
                        <button key={val} onClick={() => { setTeamMode(val); if (val === 'none') setAlternatingMode('none'); }} className={`pill ${teamMode === val ? 'pill-active' : 'pill-inactive'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {teamMode === 'split' && filtered.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-blue-50/80 dark:bg-blue-900/20 rounded-xl p-2.5 border border-blue-100 dark:border-blue-800/30">
                        <p className="font-bold text-blue-700 dark:text-blue-300 mb-1">1조 ({team1.length}명)</p>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{team1.map(t => t.name).join(', ')}</p>
                      </div>
                      <div className="bg-orange-50/80 dark:bg-orange-900/20 rounded-xl p-2.5 border border-orange-100 dark:border-orange-800/30">
                        <p className="font-bold text-orange-700 dark:text-orange-300 mb-1">2조 ({team2.length}명)</p>
                        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{team2.map(t => t.name).join(', ')}</p>
                      </div>
                    </div>
                  )}

                  {teamMode === 'split' && (
                    <div>
                      <p className="field-label mb-2">교차진행</p>
                      <div className="flex gap-1.5 items-center">
                        {([['none', '사용 안 함'], ['alternating', '교차']] as [AlternatingMode, string][]).map(([val, label]) => (
                          <button key={val} onClick={() => setAlternatingMode(val)} className={`pill ${alternatingMode === val ? 'pill-active' : 'pill-inactive'}`}>
                            {label}
                          </button>
                        ))}
                        {alternatingMode === 'alternating' && <span className="text-[10px] text-gray-400">홀수:1조, 짝수:2조</span>}
                      </div>
                    </div>
                  )}

                  {/* 임무 설정 */}
                  <div>
                    <p className="field-label mb-2">임무 설정</p>
                    <RoleEditor roles={roles} onChange={setRoles} />
                  </div>

                  {/* 회차 + 순서 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="field-label mb-2">총 회차</p>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={totalRounds}
                        onChange={e => setTotalRounds(Math.max(1, Math.min(100, Number(e.target.value))))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <p className="field-label mb-2">배정 순서</p>
                      <div className="flex gap-1.5">
                        {([['sequential', '순차'], ['random', '랜덤']] as [OrderMode, string][]).map(([val, label]) => (
                          <button key={val} onClick={() => setOrderMode(val)} className={`pill flex-1 text-center ${orderMode === val ? 'pill-active' : 'pill-inactive'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 경고 */}
                  {warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/30 text-xs text-amber-700 dark:text-amber-400">
                          <span className="text-amber-500 mt-px">&#9888;</span>
                          {w}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 생성 버튼 */}
                  <button onClick={generate} disabled={filtered.length === 0 || roles.length === 0} className="btn-primary">
                    배정 생성
                  </button>
                </div>
              </PanelSection>
            )}

            {/* 배정 미리보기 */}
            {mode === 'practice' && generated && assignments.length > 0 && (
              <div className="dash-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="panel-icon bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">👁️</div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">배정 미리보기</span>
                </div>
                <div className="space-y-1.5">
                  {assignments.slice(0, 4).map(a => (
                    <div key={a.round} className="flex items-center text-xs gap-2 py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span className="font-bold text-gray-500 dark:text-gray-400 w-10">{a.round}회</span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                        {roles.slice(0, 3).map(r => `${r}: ${a.assignments[r] ?? '—'}`).join('  ·  ')}
                      </span>
                    </div>
                  ))}
                  {assignments.length > 4 && (
                    <button onClick={() => document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full text-center text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline py-1">
                      +{assignments.length - 4}건 더 보기 ↑
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode === 'evaluation' && evalGenerated && evalAssignments.length > 0 && (
              <div className="dash-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="panel-icon bg-violet-100 dark:bg-violet-900/30 text-violet-600">👁️</div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">평가 미리보기</span>
                </div>
                <div className="space-y-1.5">
                  {evalAssignments.slice(0, 4).map(a => (
                    <div key={a.round} className="flex items-center text-xs gap-2 py-1.5 px-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <span className={`font-bold w-10 ${a.assessedGroup === 'A' ? 'text-blue-600' : 'text-amber-600'}`}>{a.round}회</span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                        평가자: {a.evaluatee} · 평가관: {a.evaluators.join(', ')}
                      </span>
                    </div>
                  ))}
                  {evalAssignments.length > 4 && (
                    <button onClick={() => document.getElementById('eval-result-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full text-center text-[11px] text-violet-600 dark:text-violet-400 font-semibold hover:underline py-1">
                      +{evalAssignments.length - 4}건 더 보기 ↑
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-6 no-print border-t border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 mt-8">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-600">
          강원 ICTC &middot; Incident Command Training Center
        </p>
        <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-0.5">
          현장지휘관 XVR 실습 교육 운영 시스템
        </p>
      </footer>
    </div>
  );
}
