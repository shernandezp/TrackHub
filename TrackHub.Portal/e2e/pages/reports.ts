/**
 * The Reports screen: the catalog accordion set and the catalog-driven filter
 * form beside it.
 *
 * What a report offers is DATA, not layout — the filter controls are built from
 * the catalog row's `filters` JSON — so the page object reads the catalog from
 * the API and drives the screen from it.
 */

import type { Page } from '@playwright/test';
import { Section } from './tableAccordion';
import { toCamelCase } from '../specs/support/text';

export interface CatalogReport {
  code: string;
  category: string;
  supportsPdf: boolean;
  requiredFeatureKey?: string | null;
  /** The catalog row's filter definitions, seeded as a JSON string. */
  filters?: string | null;
}

export interface ReportFilterDefinition {
  name: string;
  type: string;
  source?: string | null;
  labelKey: string;
}

export const filtersOf = (report: CatalogReport): ReportFilterDefinition[] =>
  report.filters ? (JSON.parse(report.filters) as ReportFilterDefinition[]) : [];

/**
 * What the catalog row actually READS on screen. i18next falls back to the raw
 * key when a report has no `reportList` entry, and 41 of the 62 seeded reports
 * currently have none (reported as a finding, pinned by its own test).
 */
export const reportLabel = (t: (key: string) => string, code: string): string => {
  const key = `reportList.${toCamelCase(code)}`;
  try {
    return t(key);
  } catch {
    return key;
  }
};

export const catalogOf = (api: { gql: <T>(b: 'manager', q: string) => Promise<T> }) =>
  api.gql<{ reports: CatalogReport[] }>(
    'manager',
    'query { reports { code category supportsPdf requiredFeatureKey filters } }'
  );

/** The card holding the selected report's filter controls. */
export const filterCard = (page: Page) => page.getByTestId('card-report-filters');

/** Opens a report's filter form: expand its category, then click its name. */
export async function chooseReport(
  page: Page,
  t: (key: string) => string,
  report: CatalogReport
): Promise<void> {
  const section = new Section(page, `report-category-${report.category.toLowerCase()}`, t);
  await section.expand();
  await page.getByText(reportLabel(t, report.code), { exact: true }).first().click();
}
