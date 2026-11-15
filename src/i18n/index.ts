// Interface text in several languages. No library: one dictionary per language, `t(key, vars)` to read it.
import { ar } from './ar';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';

export type Lang = 'en' | 'fr' | 'es' | 'ar';

/** A message with plural forms, picked by Intl.PluralRules from vars.count. "other" is always required. */
export type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type Msg = string | Plural;
export type Key = keyof typeof en;
/** Every language has exactly the English keys (TypeScript checks it). */
export type Dict = Record<Key, Msg>;

export const LANGS: { id: Lang; name: string; locale: string }[] = [
  { id: 'en', name: 'English', locale: 'en-US' },
  { id: 'fr', name: 'Français', locale: 'fr-FR' },
  { id: 'es', name: 'Español', locale: 'es-ES' },
  { id: 'ar', name: 'العربية', locale: 'ar-SA' },
];

export const DICTS: Record<Lang, Dict> = { en, fr, es, ar };

/** The browser's language if the game has it, else English. */
export function detectLang(): Lang {
  const nav = typeof navigator === 'undefined' ? '' : navigator.language?.toLowerCase() ?? '';
  return LANGS.find(l => nav.startsWith(l.id))?.id ?? 'en';
}

let current: Lang = 'en';

export const getLang = (): Lang => current;
export const localeOf = (lang: Lang): string => LANGS.find(l => l.id === lang)?.locale ?? 'en-US';

/** Sets the interface language, and the page's lang and direction (Arabic reads right to left). */
export function setLang(lang: Lang): void {
  current = DICTS[lang] ? lang : 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current;
    document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
  }
}

const rules = new Map<Lang, Intl.PluralRules>();
const pluralRule = (lang: Lang) => rules.get(lang) ?? rules.set(lang, new Intl.PluralRules(lang)).get(lang)!;

/** The text for a key in the current language (or `lang`), with {name} replaced by vars.name. */
export function t(key: Key, vars: Record<string, string | number> = {}, lang: Lang = current): string {
  const msg: Msg = DICTS[lang][key] ?? en[key];
  const text = typeof msg === 'string' ? msg : msg[pluralRule(lang).select(Number(vars.count ?? 0))] ?? msg.other;
  return text.replace(/\{(\w+)\}/g, (all, name: string) => (name in vars ? String(vars[name]) : all));
}
