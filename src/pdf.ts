import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

/** The text of every page of a PDF, in order. The file itself never leaves the browser. */
export async function pdfPageTexts(file: File): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(content.items.map(item => ('str' in item ? item.str : '')).join(' ').replace(/[ \t]+/g, ' ').trim());
  }
  return pages;
}
