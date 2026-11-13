import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

/** The picture layer of a board: freehand chalk drawing and pasted images. Drawn at a fixed size and stretched to fit. */
export const ART_W = 760;
export const ART_H = 392;

interface Props {
  /** The saved picture of this board, or null for none. */
  art: string | null;
  /** true: the mouse or finger draws. false: the layer lets clicks through to the text. */
  drawing: boolean;
  color: string;
  onChange(art: string): void;
}

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error('Could not read this picture.'));
  img.src = src;
});

/** Puts an image file on a board's picture, centred and as large as fits, on top of what is already drawn. */
export async function addPicture(file: File, existing: string | null): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = ART_W;
  canvas.height = ART_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot draw pictures.');
  if (existing) ctx.drawImage(await loadImage(existing), 0, 0, ART_W, ART_H);
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min((ART_W * 0.9) / img.width, (ART_H * 0.9) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (ART_W - w) / 2, (ART_H - h) / 2, w, h);
  } finally {
    URL.revokeObjectURL(url);
  }
  return canvas.toDataURL('image/webp', 0.8);
}

export default function BoardArt({ art, drawing, color, onChange }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const shown = useRef<string | null | undefined>(undefined);

  // Show the saved picture when the board changes. Skipped when the canvas already shows it (just after drawing).
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || shown.current === art) return;
    shown.current = art;
    ctx.clearRect(0, 0, ART_W, ART_H);
    if (art) void loadImage(art).then(img => { if (shown.current === art) ctx.drawImage(img, 0, 0, ART_W, ART_H); }).catch(() => {});
  }, [art]);

  const at = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * ART_W) / r.width, y: ((e.clientY - r.top) * ART_H) / r.height };
  };

  function down(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = at(e);
  }
  function move(e: PointerEvent<HTMLCanvasElement>) {
    const ctx = e.currentTarget.getContext('2d');
    if (!last.current || !ctx) return;
    const to = at(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last.current = to;
  }
  function up(e: PointerEvent<HTMLCanvasElement>) {
    if (!last.current) return;
    last.current = null;
    const data = e.currentTarget.toDataURL('image/webp', 0.8);
    shown.current = data;
    onChange(data);
  }

  return (
    <canvas ref={ref} width={ART_W} height={ART_H} className={`art${drawing ? ' drawing' : ''}`}
      aria-label="Picture on the board. Students cannot see it; describe it in the box below."
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
  );
}
