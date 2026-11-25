import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Section } from './tableAccordion';
import { ConfirmDialog, FormDialog } from './dialogs';
import type { Translator } from '../fixtures/i18n';
import type { Shell, NavKey } from './shell';

export interface DialogValues {
  fields?: Record<string, string>;
  selects?: Record<string, string | RegExp>;
  /** Pickers whose options are data: take whatever the first real choice is. */
  selectFirst?: string[];
}

export class CrudFlow {
  readonly section: Section;
  readonly form: FormDialog;
  readonly confirm: ConfirmDialog;

  constructor(
    readonly page: Page,
    readonly sectionKey: string,
    private readonly t: Translator
  ) {
    this.section = new Section(page, sectionKey, t);
    this.form = new FormDialog(page, t);
    this.confirm = new ConfirmDialog(page, t);
  }

  async open(): Promise<Section> {
    return this.section.expand();
  }

  private async apply(values: DialogValues): Promise<void> {
    for (const [id, value] of Object.entries(values.fields ?? {})) {
      await this.form.field(id).fill(value);
    }
    for (const [id, option] of Object.entries(values.selects ?? {})) {
      await this.form.select(id, option);
    }
    for (const id of values.selectFirst ?? []) {
      await this.form.selectFirst(id);
    }
  }

  async create(values: DialogValues, rowText: string, requiredField?: string) {
    await this.section.clickAdd();
    await this.form.waitOpen();

    if (requiredField) {
      // An empty save must be refused in the dialog, not by the backend.
      await this.form.save();
      await expect(this.form.root).toBeVisible();
      await expect(this.form.anyError.first()).toBeVisible();
    }

    await this.apply(values);
    await this.form.saveAndClose();
    return this.section.findRow(rowText);
  }

  async edit(rowText: string, values: DialogValues): Promise<void> {
    await this.section.rowAction(rowText, this.t('generic.edit'));
    await this.form.waitOpen();
    await this.apply(values);
    await this.form.saveAndClose();
  }

  async assertStored(rowText: string, values: DialogValues): Promise<void> {
    await this.section.rowAction(rowText, this.t('generic.edit'));
    await this.form.waitOpen();
    for (const [id, value] of Object.entries(values.fields ?? {})) {
      await expect(this.form.field(id)).toHaveValue(value);
    }
    for (const [id, option] of Object.entries(values.selects ?? {})) {
      await expect(this.form.root.locator(`#${id}`)).toHaveText(option);
    }
    await this.form.cancel();
  }

  /**
   * A few screens render an icon-only delete with no accessible name; there the
   * last action button in the row is the destructive one.
   */
  private deleteButton(row: import('@playwright/test').Locator) {
    const labelled = row.getByRole('button', { name: this.t('generic.delete') });
    return { labelled, fallback: row.getByRole('button').last() };
  }

  /** Retried: a row refetched mid-click swallows it, and pressing again only re-opens the dialog. */
  private async clickDelete(row: import('@playwright/test').Locator): Promise<void> {
    const { labelled, fallback } = this.deleteButton(row);
    const button = (await labelled.count()) > 0 ? labelled.first() : fallback;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await button.click();
      try {
        await expect(this.confirm.root).toBeVisible({ timeout: 5_000 });
        return;
      } catch {
        continue;
      }
    }
    await expect(this.confirm.root).toBeVisible();
  }

  async remove(rowText: string): Promise<void> {
    const row = await this.section.findRow(rowText);
    await this.clickDelete(row);
    await this.confirm.confirm();
    await expect(this.section.row(rowText)).toHaveCount(0, { timeout: 45_000 });
  }

  async removeIfPresent(rowText: string): Promise<void> {
    if (!(await this.section.isExpanded().catch(() => false))) {
      await this.section.expand().catch(() => null);
    }
    if (await this.section.searchBox.isVisible().catch(() => false)) {
      await this.section.search(rowText);
    }
    const row = this.section.row(rowText);
    if ((await row.count()) === 0) return;
    await this.clickDelete(row);
    await this.confirm.confirm();
  }

  async reload(shell: Shell, screen: NavKey): Promise<Section> {
    await shell.reloadTo(screen);
    return this.section.expand();
  }
}
