// Draws the classroom and the students as SVG markup. Pure functions: same input, same string.
import { t } from '../i18n';
import type { Emotion, Look, Student } from '../game/types';

const INK = '#2a2233';
const O = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const LINE = `fill="none" ${O}`;
const FRINGE = 'M-31,-116 C-34,-156 34,-156 31,-116 C20,-136 -20,-136 -31,-116Z';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

/** One icon and colour per student state. A raised hand wins over the emotion. */
export const STATE: Record<Emotion, { icon: string; color: string; label: string }> = {
  CONFUSED: { icon: '?', color: '#ffb98a', get label() { return t('emotion.CONFUSED'); } },
  CURIOUS: { icon: '!', color: '#bfe0ff', get label() { return t('emotion.CURIOUS'); } },
  BORED: { icon: 'z', color: '#d5d9e2', get label() { return t('emotion.BORED'); } },
  HAPPY: { icon: '♪', color: '#bff0c8', get label() { return t('emotion.HAPPY'); } },
  NEUTRAL: { icon: '…', color: '#ffffff', get label() { return t('emotion.NEUTRAL'); } },
};
export const HAND = { icon: '✋', color: '#ffc533', bubble: '#24304f', get label() { return t('emotion.hand'); } };

/** [behind the head, in front of the head] */
function hair(l: Look): [string, string] {
  const f = `fill="${l.hairColor}" ${O}`;
  switch (l.hair) {
    case 'long': return [`<path d="M-35,-118 C-40,-164 40,-164 35,-118 L40,-58 L-40,-58Z" ${f}/>`, `<path d="${FRINGE}" ${f}/>`];
    case 'bob': return [`<path d="M-36,-120 C-40,-164 40,-164 36,-120 L37,-88 L-37,-88Z" ${f}/>`, `<path d="M-31,-114 C-36,-158 36,-158 31,-114 L29,-128 L-29,-128Z" ${f}/>`];
    case 'spiky': return ['', `<path d="M-32,-116 L-36,-140 L-26,-134 L-24,-156 L-12,-142 L-4,-164 L6,-143 L18,-160 L22,-138 L36,-144 L31,-116 C22,-132 -22,-132 -32,-116Z" ${f}/>`];
    case 'curly': return ['', [[-31, -118], [31, -118], [-26, -132], [28, -132], [-14, -146], [17, -145], [2, -150]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="11" ${f}/>`).join('')];
    case 'pigtails': return [`<ellipse cx="-42" cy="-100" rx="10" ry="20" ${f}/><ellipse cx="42" cy="-100" rx="10" ry="20" ${f}/>`, `<path d="${FRINGE}" ${f}/>`];
    case 'bun': return [`<circle cx="0" cy="-160" r="13" ${f}/>`, `<path d="${FRINGE}" ${f}/>`];
    case 'cap': return [`<path d="M-32,-110 C-34,-140 34,-140 32,-110Z" ${f}/>`, `<path d="M-33,-126 C-33,-164 33,-164 33,-126Z" fill="${l.shirt}" ${O}/><path d="M-33,-126 L46,-126 Q54,-121 44,-119 L-33,-120Z" fill="${l.shirt}" ${O}/>`];
    case 'hijab': return ['', `<path fill-rule="evenodd" d="M-38,-116 C-42,-168 42,-168 38,-116 C42,-84 34,-58 0,-52 C-34,-58 -42,-84 -38,-116Z M-23,-112 a23,28 0 1,0 46,0 a23,28 0 1,0 -46,0Z" ${f}/>`];
    case 'wavy': return [
      `<path d="M-34,-122 C-40,-166 40,-166 34,-122 C40,-108 36,-98 42,-88 C46,-80 40,-72 44,-64 C36,-60 30,-64 26,-70 L-26,-70 C-30,-64 -36,-60 -44,-64 C-40,-72 -46,-80 -42,-88 C-36,-98 -40,-108 -34,-122Z" ${f}/>`,
      `<path d="M-31,-116 C-36,-160 36,-160 31,-108 C24,-120 6,-128 -10,-140 C-18,-134 -26,-126 -31,-116Z" ${f}/>`
      + `<path d="M-31,-118 C-36,-100 -34,-90 -28,-80 C-30,-94 -28,-106 -25,-118Z M31,-112 C36,-98 34,-88 28,-80 C30,-92 28,-102 25,-112Z" ${f}/>`,
    ];
    default: return ['', `<path d="M-31,-116 C-36,-158 36,-158 31,-116 C26,-134 6,-140 -10,-136 C-20,-134 -27,-126 -31,-116Z" ${f}/>`];
  }
}

function face(l: Look, e: Emotion, blinkDelay: number): string {
  const brows = e === 'CONFUSED' ? 'M-18,-126 l11,-3 M7,-131 l11,3'
    : e === 'CURIOUS' ? 'M-18,-129 q6,-5 12,0 M6,-129 q6,-5 12,0'
    : e === 'BORED' ? 'M-18,-124 h12 M6,-124 h12'
    : 'M-18,-126 q6,-3 12,0 M6,-126 q6,-3 12,0';
  let eyes: string;
  if (e === 'HAPPY') {
    eyes = `<path d="M-17,-112 q5,-7 10,0 M7,-112 q5,-7 10,0" ${LINE} stroke-width="2.5"/>`;
  } else {
    const dx = e === 'BORED' ? 2.5 : 0;
    const eye = (x: number) => `<ellipse cx="${x}" cy="-113" rx="6" ry="6.5" fill="#fff" ${O} stroke-width="1.5"/><circle cx="${x + dx}" cy="-112.5" r="3.2" fill="${INK}"/>`;
    const lid = (x: number) => `<rect x="${x - 7.5}" y="-121" width="15" height="8" fill="${l.skin}"/><path d="M${x - 6.5},-113 h13" ${LINE}/>`;
    eyes = eye(-12) + eye(12) + (e === 'BORED' ? lid(-12) + lid(12) : '');
  }
  const mouth = e === 'HAPPY' ? `<path d="M-9,-99 Q0,-86 9,-99Z" fill="#8c2f39" ${O}/>`
    : e === 'CURIOUS' ? `<ellipse cx="0" cy="-95" rx="4" ry="5" fill="#8c2f39" ${O}/>`
    : e === 'CONFUSED' ? `<path d="M-8,-94 q4,-5 8,0 t8,0" ${LINE}/>`
    : e === 'BORED' ? `<path d="M-7,-94 h14" ${LINE}/>`
    : `<path d="M-7,-96 Q0,-92 7,-96" ${LINE}/>`;
  const glasses = l.glasses ? `<circle cx="-12" cy="-113" r="9.5" ${LINE}/><circle cx="12" cy="-113" r="9.5" ${LINE}/><path d="M-2.5,-113 h5" ${LINE}/>` : '';
  return `<circle cx="-20" cy="-102" r="5" fill="#f2748a" opacity=".3"/><circle cx="20" cy="-102" r="5" fill="#f2748a" opacity=".3"/>`
    + `<path d="${brows}" ${LINE} stroke-width="2.5"/><g class="eyes" style="animation-delay:${blinkDelay.toFixed(1)}s">${eyes}</g>`
    + `<path d="M-1,-107 q-3,6 2,7" ${LINE} stroke-width="1.5"/><g class="mouth">${mouth}</g>${glasses}`;
}

/** Head and shoulders, drawn around the point (0,0) at the bottom centre of the torso. */
export function bust(l: Look, e: Emotion, blinkDelay = 0): string {
  const [back, front] = hair(l);
  const skin = `fill="${l.skin}" ${O}`;
  const sash = l.graduate ? `<path d="M-9,-60 L0,-46 L9,-60Z" fill="#f4c2cf" ${O}/><path d="M12,-60 L24,-58 L22,0 L10,0Z" fill="#f7f5ee" ${O}/>` : '';
  const cap = l.graduate ? `<path d="M-24,-158 L24,-158 L23,-145 Q0,-141 -23,-145Z" fill="#1d2440" ${O}/><path d="M-44,-160 L0,-171 L44,-160 L0,-150Z" fill="#1d2440" ${O}/><path d="M0,-160 L32,-156 L34,-136" fill="none" stroke="#e8c46a" stroke-width="2.5"/><rect x="31" y="-138" width="6" height="9" rx="2" fill="#e8c46a"/>` : '';
  return `${back}<path d="M-42,0 Q-46,-52 -22,-60 L22,-60 Q46,-52 42,0Z" fill="${l.shirt}" ${O}/>${sash}`
    + `<rect x="-9" y="-76" width="18" height="20" ${skin}/><ellipse cx="-30" cy="-112" rx="5" ry="7" ${skin}/><ellipse cx="30" cy="-112" rx="5" ry="7" ${skin}/>`
    + `<path d="M-30,-118 C-30,-152 30,-152 30,-118 C30,-94 16,-74 0,-74 C-16,-74 -30,-94 -30,-118Z" ${skin}/>${face(l, e, blinkDelay)}${front}${cap}`;
}

export function portraitSvg(s: Student): string {
  return `<svg viewBox="-50 -172 100 112" aria-hidden="true">${bust(s.persona.look, s.emotion)}</svg>`;
}

function kid(s: Student, x: number, y: number, scale: number, selected: boolean, talking: boolean, still: boolean): string {
  const l = s.persona.look;
  const sleeve = `fill="none" stroke="${l.shirt}" stroke-width="13" stroke-linecap="round"`;
  const skin = `fill="${l.skin}" ${O}`;
  const wave = still ? '' : '<animateTransform attributeName="transform" type="rotate" values="-4 36 -48;7 36 -48;-4 36 -48" dur="1.1s" repeatCount="indefinite"/>';
  const rightArm = s.handUp
    ? `<g>${wave}<path d="M36,-48 L48,-104" ${sleeve}/><path d="M48,-104 L52,-146" fill="none" stroke="${l.skin}" stroke-width="11" stroke-linecap="round"/><circle cx="53" cy="-154" r="9" ${skin}/></g>`
    : `<path d="M36,-46 Q46,-28 34,-20" ${sleeve}/>`;
  const st = s.handUp ? { icon: HAND.icon, fill: HAND.bubble, label: HAND.label } : { icon: STATE[s.emotion].icon, fill: STATE[s.emotion].color, label: STATE[s.emotion].label };
  const bubble = `<g class="emote"><circle cx="-46" cy="-160" r="16" fill="${st.fill}" ${O}/><text x="-46" y="-153" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="${s.handUp ? 17 : 21}" fill="${INK}">${st.icon}</text></g>`;
  const name = esc(s.persona.name);
  const blink = (s.persona.name.length * 0.7) % 4;
  return `<g class="kid${selected ? ' sel' : ''}${talking ? ' talking' : ''}" transform="translate(${x} ${y}) scale(${scale})" data-id="${esc(s.persona.id)}" role="button" tabindex="0" aria-pressed="${selected}" aria-label="${name}, ${st.label}">`
    + `${bust(l, s.emotion, blink)}<path d="M-36,-46 Q-46,-28 -34,-20" ${sleeve}/>${rightArm}`
    + `<rect x="-64" y="-16" width="128" height="14" rx="3" fill="#c79a6a" ${O}/><rect x="-58" y="-2" width="116" height="48" fill="#9b6b43" ${O}/>`
    + `<rect x="-16" y="-24" width="32" height="9" fill="#fff" ${O} stroke-width="1.5" transform="rotate(-4)"/>`
    + `<circle cx="-34" cy="-18" r="8" ${skin}/>${s.handUp ? '' : `<circle cx="34" cy="-18" r="8" ${skin}/>`}`
    + `<rect class="plate" x="-32" y="10" width="64" height="22" rx="5" ${O}/><text x="0" y="26" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="15" fill="${INK}">${name}</text>${bubble}</g>`;
}

/** The green writing area of the board, in drawing units (the drawing is 1200 × 850). */
export const BOARD = { x: 220, y: 38, w: 760, h: 392 };
const SCENE_W = 1200;
const SCENE_H = 850;

/**
 * Where to place something over the board, as percentages of the drawing, so it lines up at any size.
 * inset moves it in from the edge of the green area, in drawing units.
 */
export function boardArea(inset: number): { left: string; top: string; width: string; height: string } {
  const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  return {
    left: pct(BOARD.x + inset, SCENE_W),
    top: pct(BOARD.y + inset * 0.6, SCENE_H),
    width: pct(BOARD.w - inset * 2, SCENE_W),
    height: pct(BOARD.h - inset * 1.2, SCENE_H),
  };
}

/** Wall, floor, window, empty board, clock and poster. The board text is an HTML layer on top. */
const ROOM = () => `<rect width="1200" height="580" fill="#e9e1cf"/><rect y="580" width="1200" height="270" fill="#b9895a"/>`
  + `<path d="M0,650 H1200 M0,740 H1200 M150,580 V650 M520,580 V650 M900,580 V650 M330,650 V740 M720,650 V740 M1080,650 V740 M120,740 V850 M560,740 V850 M960,740 V850" stroke="#9c6f45" stroke-width="2" fill="none"/>`
  + `<rect y="568" width="1200" height="14" fill="#2f4a3e" ${O}/>`
  + `<rect x="30" y="70" width="156" height="200" rx="6" fill="#fff" ${O}/><rect x="42" y="82" width="132" height="176" fill="#9fd4f5" ${O}/>`
  + `<circle cx="148" cy="112" r="16" fill="#ffd95a"/><path transform="translate(-30 20) scale(.8)" d="M96,170 q14,-22 34,-8 q12,-18 32,-4 q22,-4 20,14 q-2,10 -16,10 h-62 q-14,-2 -8,-12Z" fill="#fff"/>`
  + `<path d="M108,82 V258 M42,170 H174" stroke="#fff" stroke-width="8"/><path d="M108,82 V258 M42,170 H174" stroke="${INK}" stroke-width="1" opacity=".35"/>`
  + `<rect x="${BOARD.x - 14}" y="${BOARD.y - 14}" width="${BOARD.w + 28}" height="${BOARD.h + 28}" rx="6" fill="#6b4a2e" ${O}/><rect x="${BOARD.x}" y="${BOARD.y}" width="${BOARD.w}" height="${BOARD.h}" fill="#27443a" ${O}/>`
  + `<rect x="220" y="430" width="760" height="12" fill="#7a5534" ${O}/><rect x="270" y="424" width="34" height="7" rx="3" fill="#fff"/><rect x="314" y="424" width="22" height="7" rx="3" fill="#ffd95a"/>`
  + `<circle cx="1095" cy="110" r="38" fill="#fff" ${O} stroke-width="4"/><path d="M1095,110 V84 M1095,110 L1115,122" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="1095" cy="110" r="3" fill="${INK}"/>`
  + `<rect x="1016" y="180" width="158" height="96" rx="4" fill="#f4ecd8" ${O}/><text x="1095" y="236" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="${INK}">${esc(t('scene.poster'))}</text>`;

export const SCENE_VIEWBOX = '0 0 1200 850';
const BACK_X = [160, 380, 600, 820, 1040];
const FRONT_X = [140, 370, 600, 830, 1060];

/**
 * Everything inside the scene's <svg>. The first five students sit in the back row.
 * still = true leaves out the arm-waving animation (for people who prefer reduced motion).
 */
export function sceneSvg(students: Student[], selectedId: string, talkingId: string | null, still: boolean): string {
  return ROOM() + students.slice(0, 10).map((s, i) => {
    const sel = s.persona.id === selectedId;
    const talk = s.persona.id === talkingId;
    return i < 5 ? kid(s, BACK_X[i], 606, 0.8, sel, talk, still) : kid(s, FRONT_X[i - 5], 798, 1, sel, talk, still);
  }).join('');
}
