import { useState } from 'react';

const DEFAULT_ROLES = ['실습자', '예비', '상황판 작성', '평가표 작성 1', '평가표 작성 2'];

interface Props {
  roles: string[];
  onChange: (roles: string[]) => void;
}

export default function RoleEditor({ roles, onChange }: Props) {
  const [newRole, setNewRole] = useState('');

  function add() {
    const r = newRole.trim();
    if (!r || roles.includes(r)) return;
    onChange([...roles, r]);
    setNewRole('');
  }

  function remove(i: number) {
    onChange(roles.filter((_, idx) => idx !== i));
  }

  function rename(i: number, value: string) {
    const updated = [...roles];
    updated[i] = value;
    onChange(updated);
  }

  function reset() {
    onChange(DEFAULT_ROLES);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {roles.map((role, i) => (
          <div key={i} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 rounded-lg px-2 py-1">
            <input
              value={role}
              onChange={e => rename(i, e.target.value)}
              className="bg-transparent text-sm text-blue-800 dark:text-blue-200 w-24 focus:outline-none"
            />
            <button
              onClick={() => remove(i)}
              className="text-blue-400 hover:text-red-500 dark:text-blue-300 dark:hover:text-red-400 text-xs ml-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newRole}
          onChange={e => setNewRole(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="임무명 입력"
          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={add}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          추가
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
        >
          초기화
        </button>
      </div>
    </div>
  );
}
