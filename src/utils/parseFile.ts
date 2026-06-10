import type { Trainee } from '../types';

export async function parsePDF(file: File): Promise<Trainee[]> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const trainees: Trainee[] = [];

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    fullText += pageText + '\n';
  }

  // Parse trainee list - look for group A and B sections
  const lines = fullText.split(/\s+/).filter(Boolean);

  // Strategy: find names near group labels A/B
  // Pattern: number, [image placeholder], org, dept, rank(소방경), name, group(A/B)
  const groupANames: string[] = [];
  const groupBNames: string[] = [];

  // Find sequences: 소방경 <name> A or 소방경 <name> B
  for (let i = 0; i < lines.length - 2; i++) {
    if (lines[i] === '소방경') {
      const name = lines[i + 1];
      const groupCandidate = lines[i + 2];
      if (groupCandidate === 'A' || groupCandidate === 'B') {
        if (/^[가-힣]{2,4}$/.test(name)) {
          if (groupCandidate === 'A') groupANames.push(name);
          else groupBNames.push(name);
        }
      }
    }
  }

  groupANames.forEach(name => trainees.push({ name, group: 'A' }));
  groupBNames.forEach(name => trainees.push({ name, group: 'B' }));

  return trainees;
}

export async function parseExcel(file: File): Promise<Trainee[]> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const trainees: Trainee[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const nameCell = String(row[0] ?? '').trim();
      const groupCell = String(row[1] ?? '').trim().toUpperCase();
      if (/^[가-힣]{2,4}$/.test(nameCell) && (groupCell === 'A' || groupCell === 'B')) {
        trainees.push({ name: nameCell, group: groupCell as 'A' | 'B' });
      }
    }
  }

  return trainees;
}

export async function parseFile(file: File): Promise<Trainee[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return parsePDF(file);
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return parseExcel(file);
  throw new Error('지원하지 않는 파일 형식입니다. PDF 또는 Excel 파일을 업로드하세요.');
}
