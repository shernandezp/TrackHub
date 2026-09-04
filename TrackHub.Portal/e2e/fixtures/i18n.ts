/**
 * Locale-aware selector helper.
 *
 * Every visible string in the portal comes from `src/locales/{en,es}.json`, so a
 * test that selects by accessible NAME has to resolve the same key the component
 * rendered. Resolving through the real bundles is what lets one test body run in
 * both languages (`chromium` vs `chromium-es`) instead of duplicating selectors.
 */

import en from '../../src/locales/en.json';
import es from '../../src/locales/es.json';

export type Language = 'en' | 'es';

const BUNDLES: Record<Language, unknown> = { en, es };

/** The language the current Playwright project drives the UI in. */
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
 * Resolves a translation key for a language, falling back to English exactly as
 * i18next does (`fallbackLng: 'en'`). Throws on an unknown key: a silently
 * missing string would turn into a selector that can never match.
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

/** A translator bound to one language. */
export const translatorFor = (language: Language): Translator =>
  (key, vars) => translate(key, language, vars);

/**
 * Every leaf key in a bundle, `a.b.c` form. Used by the i18n spec to prove no raw
 * key leaked into rendered text.
 */
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
