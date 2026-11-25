/**
 * Selectors resolve through the real locale bundles so one test body runs in
 * both languages (`chromium` vs `chromium-es`).
 */

import en from '../../src/locales/en.json';
import es from '../../src/locales/es.json';
import editionEn from '../../src/edition/locales/en.json';
import editionEs from '../../src/edition/locales/es.json';

export type Language = 'en' | 'es';

/**
 * Mirrors the deep merge in `src/index.tsx`; without it edition keys resolve to
 * the core value and the selector looks for a string the screen never rendered.
 */
function mergeTranslations(core: unknown, edition: unknown): unknown {
  if (core === null || edition === null || typeof core !== 'object' || typeof edition !== 'object') {
    return edition ?? core;
  }
  const merged: Record<string, unknown> = { ...(core as Record<string, unknown>) };
  for (const [key, value] of Object.entries(edition)) {
    merged[key] = key in merged ? mergeTranslations(merged[key], value) : value;
  }
  return merged;
}

export const BUNDLES: Record<Language, unknown> = {
  en: mergeTranslations(en, editionEn),
  es: mergeTranslations(es, editionEs),
};

export const activeLanguage = (): Language =>
  (process.env.E2E_LANG === 'es' ? 'es' : 'en');

function lookup(bundle: unknown, key: string): string | undefined {
  let node: unknown = bundle;
  for (const segment of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[segment];
  }
  return typeof node === 'string' ? node : undefined;
}

/** i18next's `{{name}}` interpolation — the only feature the bundles use. */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

/**
 * Falls back to English like i18next (`fallbackLng: 'en'`). Throws on an unknown
 * key: a silently missing string would make a selector that can never match.
 */
export function translate(
  key: string,
  language: Language = activeLanguage(),
  vars?: Record<string, string | number>
): string {
  const text = lookup(BUNDLES[language], key) ?? lookup(BUNDLES.en, key);
  if (text === undefined) {
    throw new Error(`Unknown i18n key "${key}" — it exists in neither ${language} nor en.`);
  }
  return interpolate(text, vars);
}

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

export const translatorFor = (language: Language): Translator =>
  (key, vars) => translate(key, language, vars);

export function allKeys(language: Language = 'en'): string[] {
  const keys: string[] = [];
  const walk = (node: unknown, prefix: string): void => {
    if (node === null || typeof node !== 'object') return;
    for (const [name, child] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${name}` : name;
      if (typeof child === 'string') keys.push(path);
      else walk(child, path);
    }
  };
  walk(BUNDLES[language], '');
  return keys;
}
