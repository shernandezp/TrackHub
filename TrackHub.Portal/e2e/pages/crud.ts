/**
 * The create/edit/delete shape almost every administrative section shares.
 *
 * The screens differ only in which fields a dialog carries, so the steps live
 * here and each test states its own requirement: what it creates, what it
 * changes, and what must still be true after a reload.
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Section } from './tableAccordion';
import { ConfirmDialog, FormDialog } from './dialogs';
import type { Translator } from '../fixtures/i18n';
import type { Shell, NavKey } from './shell';

export interface DialogValues {
  /** Plain fields, keyed by the `id` the control renders. */
  fields?: Record<string, string>;
  /** `CustomSelect` choices, keyed by field id, valued by visible option label. */
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

  /** Opens Add, refuses an empty save, then fills and saves. Returns the row. */
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

  /** Opens the row's Edit, applies the changes and saves. */
  async edit(rowText: string, values: DialogValues): Promise<void> {
    await this.section.rowAction(rowText, this.t('generic.edit'));
    await this.form.waitOpen();
    await this.apply(values);
    await this.form.saveAndClose();
  }

  /** Re-opens the row's dialog and asserts the stored values. */
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
   * The row's delete affordance. Most screens label it "Delete"; a few render an
   * icon-only button with no accessible name, and there the last action button
   * in the row is the destructive one.
   */
  private deleteButton(row: import('@playwright/test').Locator) {
    const labelled = row.getByRole('button', { name: this.t('generic.delete') });
    return { labelled, fallback: row.getByRole('button').last() };
  }

  private async clickDelete(row: import('@playwright/test').Locator): Promise<void> {
    const { labelled, fallback } = this.deleteButton(row);
    await ((await labelled.count()) > 0 ? labelled.first() : fallback).click();
  }

  /** Deletes the row through its confirm dialog and waits for it to disappear. */
  async remove(rowText: string): Promise<void> {
    const row = await this.section.findRow(rowText);
    await this.clickDelete(row);
    await this.confirm.confirm();
    await expect(this.section.row(rowText)).toHaveCount(0, { timeout: 45_000 });
  }

  /** Deletes the row if it is still there — for a cleanup step. */
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

  /** Reloads the screen and returns to this section, expanded. */
  async reload(shell: Shell, screen: NavKey): Promise<Section> {
    await shell.reloadTo(screen);
    return this.section.expand();
  }
}
