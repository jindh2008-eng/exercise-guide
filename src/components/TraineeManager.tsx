import { useState } from 'react';
import type { Trainee } from '../types';

interface Props {
  trainees: Trainee[];
  onChange: (trainees: Trainee[]) => void;
}

export default function TraineeManager({ trainees, onChange }: Props) {
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<'A' | 'B'>('A');

  function add() {
    const name = newName.trim();
    if (!name) return;
    onChange([...trainees, { name, group: newGroup }]);
    setNewName('');
  }

  function remove(index: number) {
    onChange(trainees.filter((_, i) => i !== index));
  }

  function clear() {
    onChange([]);
  }

  const groupA = trainees.filter(t => t.group === 'A');
  const groupB = trainees.filter(t => t.group === 'B');

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="성명 입력"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={newGroup}
          onChange={e => setNewGroup(e.target.value as 'A' | 'B')}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="A">A반</option>
          <option value="B">B반</option>
        </select>
        <button
          onClick={add}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          추가
        </button>
        {trainees.length > 0 && (
          <button
            onClick={clear}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
          >
            전체 삭제
          </button>
        )}
      </div>

      {trainees.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {(['A', 'B'] as const).map(g => {
            const list = g === 'A' ? groupA : groupB;
            return (
              <div key={g} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {g}반 ({list.length}명)
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {list.map((t) => {
                    const globalIdx = trainees.findIndex(x => x === t);
                    return (
                      <div key={globalIdx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-800 dark:text-gray-200">{t.name}</span>
                        <button
                          onClick={() => remove(globalIdx)}
                          className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-2 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
