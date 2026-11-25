/**
 * Each shared dialog carries a stable `data-testid`, because a screen can have
 * several mounted at once and `getByRole('dialog')` cannot tell them apart.
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import type { Translator } from '../fixtures/i18n';

/**
 * MUI renders the options in a portal outside the control's subtree, so they are
 * looked up on the page; the first entry is the disabled placeholder.
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

/**
 * Opens a picker and chooses `label`. Server-searched pickers list one page, so the label is
 * typed first when the trigger is a text input.
 */
export async function pickOption(
  page: Page,
  trigger: Locator,
  label: string | RegExp,
  exact = false
): Promise<void> {
  await trigger.click();
  if (typeof label === 'string' && (await trigger.evaluate((el) => el.tagName === 'INPUT'))) {
    await trigger.fill(label);
  }
  await page.getByRole('option', { name: label, exact }).first().click();
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

  field(id: string): Locator {
    return this.root.locator(`#${id}`);
  }

  async fill(values: Record<string, string>): Promise<void> {
    for (const [id, value] of Object.entries(values)) {
      await this.field(id).fill(value);
    }
  }

  /** MUI renders the options in a portal outside the dialog. */
  async select(id: string, optionLabel: string | RegExp): Promise<void> {
    await pickOption(this.page, this.root.locator(`#${id}`), optionLabel);
  }

  /** The first option is the placeholder and is rendered disabled. */
  async selectFirst(id: string): Promise<string> {
    return selectFirstOption(this.page, this.root, id);
  }

  error(id: string): Locator {
    return this.root.locator(`#${id}-helper-text, #${id}-error`);
  }

  /** `useForm` gives each message the id `<field>-helper-text`. */
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

  async add(optionLabel: string | RegExp): Promise<void> {
    await pickOption(this.page, this.root.getByRole('combobox').first(), optionLabel);
    await this.root.getByRole('button', { name: this.t('generic.add') }).click();
  }

  get rows(): Locator {
    return this.root.locator('tbody tr');
  }

  row(text: string | RegExp): Locator {
    return this.rows.filter({ hasText: text }).first();
  }

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
 * Not a MUI dialog: it renders inline inside a section, and its checkboxes carry
 * `data-row-id`/`data-column-id`.
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

  /** Granted then revoked by the caller, leaving the matrix as it was found. */
  async firstUngranted(): Promise<Locator> {
    const total = await this.cells.count();
    for (let index = 0; index < total; index += 1) {
      const cell = this.cells.nth(index);
      if (!(await cell.isChecked())) return cell;
    }
    throw new Error('Every cell in the matrix is already granted — nothing safe to toggle.');
  }
}
