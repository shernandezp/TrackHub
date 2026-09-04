/**
 * Reports: the catalog, the catalog-driven filter form, the on-screen preview
 * and the Excel/PDF exports.
 *
 * A preview returns rows only when the account has data for that report, so the
 * assertion is "the preview answered" — rows or the explicit no-rows message —
 * never a row count.
 */

import fs from 'node:fs';
import { test, expect } from '../fixtures';
import { Section } from '../pages/tableAccordion';
import {
  catalogOf,
  chooseReport,
  filterCard,
  filtersOf,
  reportLabel,
} from '../pages/reports';
import type { CatalogReport } from '../pages/reports';

test.describe('reports', () => {
  test('the catalog offers every report the account is entitled to, grouped by category', async ({
    shell,
    page,
    t,
    api,
  }) => {
    const catalog = await catalogOf(api);
    expect(catalog.reports.length).toBeGreaterThan(0);

    await shell.open('reports');

    // The catalog is an accordion set that keeps exactly one category open, so
    // each group is checked while it is the open one.
    const byCategory = new Map<string, CatalogReport[]>();
    for (const report of catalog.reports) {
      const key = report.category.toLowerCase();
      byCategory.set(key, [...(byCategory.get(key) ?? []), report]);
    }

    for (const [category, reports] of byCategory) {
      const section = new Section(page, `report-category-${category}`, t);
      await expect(section.root).toBeVisible({ timeout: 60_000 });
      await section.expand();
      for (const report of reports) {
        await expect(
          section.root.getByText(reportLabel(t, report), { exact: true })
        ).toBeVisible();
      }
    }
  });

  test('no report is offered under a raw translation key', async ({ shell, page, t, api }) => {
    const catalog = await catalogOf(api);
    const categories = new Set(catalog.reports.map((report) => report.category.toLowerCase()));

    await shell.open('reports');

    for (const category of categories) {
      const section = new Section(page, `report-category-${category}`, t);
      await expect(section.root).toBeVisible({ timeout: 60_000 });
      await section.expand();
      await expect(section.root.getByText(/^report(List|Descriptions)\./)).toHaveCount(0);
    }
  });

  test('choosing a report renders the filters its catalog row declares', async ({
    shell,
    page,
    t,
    api,
  }) => {
    const catalog = await catalogOf(api);
    const report = catalog.reports.find((candidate) => filtersOf(candidate).length > 0);
    expect(report, 'no report in the catalog declares any filter').toBeDefined();

    await shell.open('reports');
    await chooseReport(page, t, report!);

    const filters = filterCard(page);

    for (const definition of filtersOf(report!)) {
      await expect(filters.locator(`#${definition.name}`)).toBeVisible();
    }
    await expect(page.getByRole('button', { name: t('reports.exportExcel') })).toBeVisible();
  });

  test('a lookup filter offers "All" as a real, selectable choice', async ({
    shell,
    page,
    t,
    api,
  }) => {
    const catalog = await catalogOf(api);
    const report = catalog.reports.find((candidate) =>
      filtersOf(candidate).some((filter) => filter.source)
    );
    test.skip(
      !report,
      'No report in this deployment declares a lookup-backed filter, so there is no "All" picker to exercise.'
    );
    const picker = filtersOf(report!).find((filter) => filter.source)!;

    await shell.open('reports');
    await chooseReport(page, t, report!);

    const control = page.locator(`#${picker.name}`);
    await expect(control).toBeVisible();
    // Every catalog filter is optional: empty reads as "All" and stays reachable.
    await expect(control).toContainText(t('reports.all'));
    await control.click();
    await expect(page.getByRole('option', { name: t('reports.all') })).toBeEnabled();
    await page.keyboard.press('Escape');
  });

  test('the preview answers with rows or with the no-rows message', async ({
    shell,
    page,
    t,
    api,
  }) => {
    const catalog = await catalogOf(api);
    await shell.open('reports');
    await chooseReport(page, t, catalog.reports[0]);

    await page.getByRole('button', { name: t('reports.preview') }).click();
    // Bounded well under the test timeout: a preview that never answers should
    // report a failed assertion, not burn the whole 120 s budget.
    await expect(
      page.getByText(/Total rows:/).or(page.getByText(t('reports.noPreviewRows'))).first()
    ).toBeVisible({ timeout: 30_000 });
  });

  test('Excel export downloads a real workbook', async ({ shell, page, t, api }, testInfo) => {
    const catalog = await catalogOf(api);
    await shell.open('reports');
    await chooseReport(page, t, catalog.reports[0]);

    const download = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: t('reports.exportExcel') }).click();
    const file = await download;

    expect(file.suggestedFilename()).toMatch(/\.xlsx$/i);
    const saved = testInfo.outputPath('report.xlsx');
    await file.saveAs(saved);
    // A real workbook, not an error page: xlsx files are ZIP archives.
    expect(fs.readFileSync(saved).subarray(0, 2).toString('latin1')).toBe('PK');
  });

  test('PDF export downloads a real PDF', async ({ shell, page, t, api }, testInfo) => {
    const catalog = await catalogOf(api);
    const report = catalog.reports.find((candidate) => candidate.supportsPdf);
    expect(report, 'no report advertises PDF support').toBeDefined();

    await shell.open('reports');
    await chooseReport(page, t, report!);

    const download = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: t('reports.exportPdf') }).click();
    const file = await download;

    expect(file.suggestedFilename()).toMatch(/\.pdf$/i);
    const saved = testInfo.outputPath('report.pdf');
    await file.saveAs(saved);
    expect(fs.readFileSync(saved).subarray(0, 4).toString('latin1')).toBe('%PDF');
  });

  test('a report whose feature is disabled is not offered', async ({ api }) => {
    // The catalog is filtered server-side by the account's entitlements, so what
    // the screen can show is exactly what the API returns.
    const catalog = await catalogOf(api);
    const context = await api.gql<{
      accountContext: { features: { featureKey: string; enabled: boolean }[] };
    }>('manager', 'query { accountContext { features { featureKey enabled } } }');
    const disabled = new Set(
      context.accountContext.features
        .filter((feature) => !feature.enabled)
        .map((feature) => feature.featureKey)
    );

    for (const report of catalog.reports) {
      if (!report.requiredFeatureKey) continue;
      expect(
        disabled.has(report.requiredFeatureKey),
        `${report.code} requires the disabled feature ${report.requiredFeatureKey} but is still in the catalog`
      ).toBe(false);
    }
  });
});
