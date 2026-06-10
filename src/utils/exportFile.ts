import type { RoleAssignment } from '../types';

export function exportToExcel(assignments: RoleAssignment[], roles: string[]): void {
  import('xlsx').then(XLSX => {
    const headers = ['회차', '실습조', '쉐도잉', ...roles];
    const rows = assignments.map(a => [
      a.round,
      a.activeTeam,
      a.supportTeam,
      ...roles.map(r => a.assignments[r] ?? '—'),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '임무배정표');
    XLSX.writeFile(wb, '지휘역량실습_임무배정표.xlsx');
  });
}

export function printPage(): void {
  window.print();
}
