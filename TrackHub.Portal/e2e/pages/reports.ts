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
  /** The row's own sentence, which names the report when the bundle has no key. */
  description?: string | null;
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

/** What the catalog row reads on screen (mirrors `utils/reportUtils.reportLabels`). */
export const reportLabel = (t: (key: string) => string, report: CatalogReport): string => {
  try {
    return t(`reportList.${toCamelCase(report.code)}`);
  } catch {
    return report.description || report.code;
  }
};

export const catalogOf = (api: { gql: <T>(b: 'manager', q: string) => Promise<T> }) =>
  api.gql<{ reports: CatalogReport[] }>(
    'manager',
    'query { reports { code category description supportsPdf requiredFeatureKey filters } }'
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
  await page.getByText(reportLabel(t, report), { exact: true }).first().click();
}
