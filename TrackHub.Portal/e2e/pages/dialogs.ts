/**
 * The shared dialog controls: `FormDialog`, `ConfirmDialog`, `MessageDialog`,
 * `DynamicTableDialog` (allocators) and `CheckboxTableDialog` (permission
 * matrices). Each carries a stable `data-testid`, because a screen can have four
 * of them mounted at once and `getByRole('dialog')` cannot tell them apart.
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { Translator } from '../fixtures/i18n';

/**
 * Picks the first REAL choice of a `CustomSelect`, wherever it is mounted.
 *
 * MUI renders the options in a portal outside the control's own subtree, so the
 * option list is always looked up on the page; the first entry is the disabled
 * placeholder. Returns the label chosen, so the caller can find the row it
 * produced.
 */
export async function selectFirstOption(
  page: Page,
  scope: Locator,
  id: string
): Promise<string> {
  await scope.locator(`#${id}`).click();
  const options = page.getByRole('option');
  const total = await options.count();
  for (let index = 0; index < total; index += 1) {
    const option = options.nth(index);
    if ((await option.getAttribute('aria-disabled')) === 'true') continue;
    const label = (await option.innerText()).trim();
    await option.click();
    return label;
  }
  throw new Error(`The "${id}" picker offers no selectable option.`);
}

export class FormDialog {
  constructor(
    readonly page: Page,
    private readonly t: Translator
  ) {}

  get root(): Locator {
    return this.page.getByTestId('dialog-form');
  }

  get saveButton(): Locator {
    return this.root.getByRole('button', { name: this.t('generic.save') });
  }

  get cancelButton(): Locator {
    return this.root.getByRole('button', { name: this.t('generic.cancel') });
  }

  async waitOpen(): Promise<Locator> {
    await expect(this.root).toBeVisible({ timeout: 30_000 });
    return this.root;
  }

  /** A text/number/date field, addressed by the `id` its control renders. */
  field(id: string): Locator {
    return this.root.locator(`#${id}`);
  }

  async fill(values: Record<string, string>): Promise<void> {
    for (const [id, value] of Object.entries(values)) {
      await this.field(id).fill(value);
    }
  }

  /**
   * A `CustomSelect`: MUI renders the trigger as a combobox and the options in a
   * portal outside the dialog, so the option is looked up on the page.
   */
  async select(id: string, optionLabel: string | RegExp): Promise<void> {
    await this.root.locator(`#${id}`).click();
    await this.page.getByRole('option', { name: optionLabel }).first().click();
  }

  /**
   * Picks the first REAL choice of a `CustomSelect`, for pickers whose options
   * are data (provider types, unit types) rather than a fixed vocabulary. The
   * first option is the placeholder and is rendered disabled.
   */
  async selectFirst(id: string): Promise<string> {
    return selectFirstOption(this.page, this.root, id);
  }

  /** Validation message rendered under a field by `useForm`. */
  error(id: string): Locator {
    return this.root.locator(`#${id}-helper-text, #${id}-error`);
  }

  /**
   * Every validation message currently rendered in the dialog. `useForm` gives
   * each one the id `<field>-helper-text`, so they are addressable without
   * reaching for a MUI class name.
   */
  get anyError(): Locator {
    return this.root.locator('[id$="-helper-text"], [id$="-error"]');
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /** Saves and waits for the dialog to close — the visible proof of a success. */
  async saveAndClose(): Promise<void> {
    await this.save();
    await expect(this.root).toBeHidden({ timeout: 45_000 });
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.root).toBeHidden();
  }
}

export class ConfirmDialog {
  constructor(
    readonly page: Page,
    private readonly t: Translator
  ) {}

  get root(): Locator {
    return this.page.getByTestId('dialog-confirm');
  }

  async confirm(): Promise<void> {
    await expect(this.root).toBeVisible({ timeout: 30_000 });
    await this.root.getByRole('button', { name: this.t('generic.confirm') }).click();
    await expect(this.root).toBeHidden({ timeout: 45_000 });
  }

  async dismiss(): Promise<void> {
    await this.root.getByRole('button', { name: this.t('generic.cancel') }).click();
    await expect(this.root).toBeHidden();
  }
}

export class MessageDialog {
  constructor(
    readonly page: Page,
    private readonly t: Translator
  ) {}

  get root(): Locator {
    return this.page.getByTestId('dialog-message');
  }

  async close(): Promise<void> {
    await this.root.getByRole('button', { name: this.t('generic.close') }).click();
    await expect(this.root).toBeHidden();
  }
}

/** The allocator dialog: a picker plus the current assignments and add/remove. */
export class AllocatorDialog {
  constructor(
    readonly page: Page,
    private readonly t: Translator
  ) {}

  get root(): Locator {
    return this.page.getByTestId('dialog-dynamic-table');
  }

  async waitOpen(): Promise<Locator> {
    await expect(this.root).toBeVisible({ timeout: 30_000 });
    return this.root;
  }

  /** Picks the single entity in the dialog's select and adds it. */
  async add(optionLabel: string | RegExp): Promise<void> {
    await this.root.getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: optionLabel }).first().click();
    await this.root.getByRole('button', { name: this.t('generic.add') }).click();
  }

  /** The assignment rows currently listed (excluding the header row). */
  get rows(): Locator {
    return this.root.locator('tbody tr');
  }

  row(text: string | RegExp): Locator {
    return this.rows.filter({ hasText: text }).first();
  }

  /** Ticks a row's checkbox and removes it. */
  async remove(text: string | RegExp): Promise<void> {
    await this.row(text).locator('input[type="checkbox"]').check();
    await this.root.getByRole('button', { name: this.t('generic.delete') }).click();
  }

  async close(): Promise<void> {
    await this.root.getByRole('button', { name: this.t('generic.close') }).click();
    await expect(this.root).toBeHidden();
  }
}

/**
 * The resource/action matrix (`CheckboxTableDialog`). It is not a MUI dialog —
 * it renders inline inside a section — and its checkboxes carry
 * `data-row-id`/`data-column-id`, which is exactly the addressing a test needs.
 */
export class PermissionMatrix {
  constructor(
    readonly page: Page,
    private readonly scope: Locator
  ) {}

  /** Every checkbox in the matrix, for a "the matrix rendered at all" assertion. */
  get cells(): Locator {
    return this.scope.locator('input[type="checkbox"][data-row-id]');
  }

  /**
   * The first cell that is NOT granted, so a test can grant and then revoke it
   * and leave the matrix exactly as it found it.
   */
  async firstUngranted(): Promise<Locator> {
    const total = await this.cells.count();
    for (let index = 0; index < total; index += 1) {
      const cell = this.cells.nth(index);
      if (!(await cell.isChecked())) return cell;
    }
    throw new Error('Every cell in the matrix is already granted — nothing safe to toggle.');
  }
}
