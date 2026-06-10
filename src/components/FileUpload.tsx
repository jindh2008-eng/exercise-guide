import { useRef, useState } from 'react';
import type { Trainee } from '../types';
import { parseFile } from '../utils/parseFile';

interface Props {
  onLoad: (trainees: Trainee[]) => void;
}

export default function FileUpload({ onLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setLoading(true);
    setError('');
    try {
      const trainees = await parseFile(file);
      if (trainees.length === 0) {
        setError('명단을 찾을 수 없습니다. 파일 형식을 확인하거나 수동으로 입력하세요.');
      } else {
        onLoad(trainees);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
        />
        {loading ? (
          <p className="text-blue-600 dark:text-blue-400 font-medium">파일 분석 중...</p>
        ) : (
          <>
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              PDF 또는 Excel 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              지원 형식: .pdf, .xlsx, .xls, .csv
            </p>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
