/** Makes t() keys compile-checked against the English translation bundle. */
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      // The runtime bundle is the core translations deep-merged with the edition
      // bundle (src/edition/locales), so the key space
      // is the intersection type of both files.
      translation: typeof import('../locales/en.json') &
        typeof import('../edition/locales/en.json');
    };
    // i18next v25 / react-i18next v16 gate unknown-key compile errors behind
    // this flag; without it t() falls back to accepting any string.
    strictKeyChecks: true;
  }
}
