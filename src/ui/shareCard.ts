// A report-card picture for sharing. Holds only game data and the lesson title: never keys, student answers or other player text.

export interface CardData {
  lesson: string;
  course?: string;
  average: number;
  best: number;
  rank: string;
  difficulty: string;
  challenge: { title: string; met: boolean | null } | null;
  date: string;
  version: string;
}

const W = 1080;
const H = 1080;

/** Cuts text with "…" so it fits in width. */
function fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  if (ctx.measureText(text).width <= width) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > width) t = t.slice(0, -1);
  return `${t}…`;
}

export function drawCard(d: CardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const chalk = '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive';

  // A chalkboard in a wooden frame.
  ctx.fillStyle = '#7a4f2a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2f4a3a';
  ctx.fillRect(40, 40, W - 80, H - 80);
  ctx.fillStyle = '#f5f7f2';
  ctx.textAlign = 'center';

  const line = (text: string, y: number, size: number, color = '#f5f7f2') => {
    ctx.font = `${size}px ${chalk}`;
    ctx.fillStyle = color;
    ctx.fillText(fit(ctx, text, W - 160), W / 2, y);
  };

  line('Class Is In Session', 150, 64);
  line('Report card', 220, 38, '#c9d6cc');
  if (d.course) line(d.course, 320, 36, '#c9d6cc');
  line(d.lesson, 380, 48);
  line(`Class average ${d.average}%`, 500, 72, '#ffd866');
  line(`Best ${d.best}%  ·  ${d.difficulty} class`, 580, 38);
  line(d.rank, 680, 50);
  if (d.challenge) {
    const verdict = d.challenge.met === null ? 'Challenge not judged' : d.challenge.met ? 'Challenge met' : 'Challenge not met';
    line(verdict, 780, 40, d.challenge.met ? '#9be59b' : '#f5f7f2');
    line(d.challenge.title, 830, 30, '#c9d6cc');
  }
  line(`${d.date}  ·  v${d.version}`, 970, 26, '#c9d6cc');
  return canvas;
}

/** Shares the card as a picture where the browser can share files, otherwise downloads it. */
export async function shareCard(d: CardData): Promise<'shared' | 'downloaded'> {
  const blob = await new Promise<Blob | null>(resolve => drawCard(d).toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('The picture could not be made.');
  const file = new File([blob], 'class-is-in-session-report.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Class Is In Session', text: `I taught "${d.lesson}": class average ${d.average}%.` });
      return 'shared';
    } catch (e) {
      // The player closed the share sheet: nothing else to do.
      if (e instanceof DOMException && e.name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
