import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

const open = async (file: File) => getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;

export async function pdfPages(file: File): Promise<number> {
  return (await open(file)).numPages;
}

/** Text of pages from..to (1-based, inclusive). The file itself never leaves the browser. */
export async function pdfText(file: File, from: number, to: number): Promise<string> {
  const doc = await open(file);
  const parts: string[] = [];
  for (let n = Math.max(1, from); n <= Math.min(doc.numPages, to); n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    parts.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '));
  }
  return parts.join('\n').replace(/[ \t]+/g, ' ').trim();
}
