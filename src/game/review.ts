import type { FactError, TranscriptLine, TurnSnapshot } from './types';

/** A stretch of the transcript. turn 0: before the first turn, with no snapshot. */
export interface TurnGroup { turn: number; lines: { line: TranscriptLine; index: number }[]; snapshot: TurnSnapshot | null }

/**
 * One group per turn: the turn's own lines, then what happened before the next turn
 * (a hand called on, a question to one student). Lines before the first turn form group 0.
 */
export function groupTurns(transcript: TranscriptLine[], timeline: TurnSnapshot[]): TurnGroup[] {
  const slice = (from: number, to: number) => transcript.slice(from, to).map((line, k) => ({ line, index: from + k }));
  const starts = timeline.map(s => Math.min(s.start, transcript.length));
  const groups: TurnGroup[] = timeline.map((snapshot, k) => ({
    turn: snapshot.turn, snapshot, lines: slice(starts[k], starts[k + 1] ?? transcript.length),
  }));
  const before = starts[0] ?? transcript.length;
  return before > 0 ? [{ turn: 0, snapshot: null, lines: slice(0, before) }, ...groups] : groups;
}

const STOP = new Set('the and for are but not you all any can had her was one our out has his how its may new now see two who did get him let say she too use that with have this will your from they been were what when which their there than then them these into also just more some only very does each about would could should because'.split(' '));

/** Lowercase words, without punctuation, short words or common filler. */
export function meaningfulWords(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3 && !STOP.has(w)));
}

export const MIN_SHARED_WORDS = 3;

/**
 * For each mistake, the teacher or board line it most likely came from (the one sharing the most meaningful words;
 * ties go to the earlier line). Mistakes sharing fewer than MIN_SHARED_WORDS with every line are unmatched.
 */
export function matchClaims(transcript: TranscriptLine[], errors: FactError[]): { byLine: Map<number, FactError[]>; unmatched: FactError[] } {
  const lines = transcript.map((l, i) => ({ i, words: l.who === 'teacher' || l.who === 'board' ? meaningfulWords(l.text) : null }));
  const byLine = new Map<number, FactError[]>();
  const unmatched: FactError[] = [];
  for (const e of errors) {
    const claim = meaningfulWords(e.claim);
    let best = -1, bestCount = 0;
    for (const { i, words } of lines) {
      if (!words) continue;
      let n = 0;
      for (const w of claim) if (words.has(w)) n++;
      if (n > bestCount) { best = i; bestCount = n; }
    }
    if (bestCount >= MIN_SHARED_WORDS) byLine.set(best, [...(byLine.get(best) ?? []), e]);
    else unmatched.push(e);
  }
  return { byLine, unmatched };
}

const LOW = ['restless', 'lost'];

/** Small labels for a turn: the class drifted (mood fell to restless or lost), or goals were gained. */
export function turnMarkers(timeline: TurnSnapshot[]): Map<number, string[]> {
  const out = new Map<number, string[]>();
  timeline.forEach((s, i) => {
    const prev = timeline[i - 1];
    const marks: string[] = [];
    if (LOW.includes(s.mood) && !(prev && LOW.includes(prev.mood))) marks.push('class drifted');
    const gained = s.goals - (prev?.goals ?? 0);
    if (gained > 0) marks.push(`+${gained} goal${gained > 1 ? 's' : ''}`);
    if (marks.length) out.set(s.turn, marks);
  });
  return out;
}
