/**
 * Account Management → Alerts & Notifications: rules, subscriptions, templates,
 * alert events and the delivery log.
 *
 * A delivery cannot be observed end to end from a browser (e-mail and WhatsApp
 * leave the platform), so what is asserted here is the configuration surface and
 * the delivery list — not that a message arrived.
 */

import { test, expect, unique } from '../fixtures';
import { CrudFlow } from '../pages/crud';
import { Section } from '../pages/tableAccordion';

test.describe('account management — alerts & notifications', () => {
  test('a manager creates a notification rule and disables it again', async ({
    page,
    shell,
    t,
    api,
    cleanup,
  }) => {
    const ruleKey = `e2e-rule-${unique()}`;
    const rules = new CrudFlow(page, 'notification-rules', t);

    await shell.open('manageAdmin');
    await rules.open();
    // A rule is disabled, never deleted, so cleanup goes through the API.
    cleanup.add(`notification rule ${ruleKey}`, async () => {
      const found = await api.tryGql<{ notificationRules: { notificationRuleId: string; ruleKey: string; enabled: boolean }[] }>(
        'manager',
        'query($accountId: UUID!, $skip: Int!, $take: Int!) { notificationRules(query: { accountId: $accountId, skip: $skip, take: $take }) { notificationRuleId ruleKey enabled } }',
        { accountId: await api.accountId(), skip: 0, take: 500 }
      );
      const rule = found?.notificationRules.find((row) => row.ruleKey === ruleKey && row.enabled);
      if (rule) {
        await api.tryGql(
          'manager',
          'mutation($notificationRuleId: UUID!) { disableNotificationRule(command: { notificationRuleId: $notificationRuleId }) }',
          { notificationRuleId: rule.notificationRuleId }
        );
      }
    });

    await rules.section.clickAdd();
    await rules.form.waitOpen();
    // Every required field empty: the dialog refuses before any call is made.
    await rules.form.save();
    await expect(rules.form.root).toBeVisible();
    await expect(rules.form.anyError.first()).toBeVisible();

    await rules.form.fill({ ruleKey, ruleType: 'alert' });
    await rules.form.select('triggerEvent', t('alertEventTypes.geofenceEntered'));
    await rules.form.saveAndClose();

    const row = await rules.section.findRow(ruleKey);
    await expect(row).toBeVisible();

    await rules.reload(shell, 'manageAdmin');
    await expect(await rules.section.findRow(ruleKey)).toBeVisible();

    // A rule is disabled, not deleted — the audit trail keeps the history.
    const stored = await rules.section.findRow(ruleKey);
    await stored.getByRole('button', { name: t('notificationRules.disable') }).click();
    await expect
      .poll(async () => (await rules.section.findRow(ruleKey)).innerText(), { timeout: 45_000 })
      .toContain(t('generic.no'));
  });

  test('a manager subscribes a user to alerts and removes the subscription', async ({
    page,
    shell,
    t,
    api,
    cleanup,
  }) => {
    const subscriptions = new CrudFlow(page, 'alert-subscriptions', t);
    const userId = await api.currentUserId();

    await shell.open('manageAdmin');
    await subscriptions.open();

    await subscriptions.section.clickAdd();
    await subscriptions.form.waitOpen();
    await subscriptions.form.select('principalType', t('alertSubscriptions.user'));
    await subscriptions.form.field('principalId').fill(userId);
    await subscriptions.form.select('channel', t('notificationChannels.inApp'));
    await subscriptions.form.saveAndClose();

    const shortId = userId.substring(0, 8);
    const row = await subscriptions.section.findRow(shortId);
    await expect(row).toBeVisible();
    cleanup.add(`alert subscription ${shortId}`, async () => {
      await shell.open('manageAdmin');
      await subscriptions.open();
      const stale = subscriptions.section.row(shortId);
      if ((await stale.count()) > 0) {
        await stale.getByRole('button', { name: t('generic.delete') }).click();
        await subscriptions.confirm.confirm();
      }
    });

    await subscriptions.reload(shell, 'manageAdmin');
    await expect(await subscriptions.section.findRow(shortId)).toBeVisible();

    await subscriptions.remove(shortId);
  });

  test('the subscription dialog rejects a recipient id that is not a GUID', async ({
    page,
    shell,
    t,
  }) => {
    const subscriptions = new CrudFlow(page, 'alert-subscriptions', t);
    await shell.open('manageAdmin');
    await subscriptions.open();

    await subscriptions.section.clickAdd();
    await subscriptions.form.waitOpen();
    await subscriptions.form.select('principalType', t('alertSubscriptions.user'));
    await subscriptions.form.field('principalId').fill('not-a-guid');
    await subscriptions.form.select('channel', t('notificationChannels.inApp'));
    await subscriptions.form.save();

    await expect(subscriptions.form.root).toBeVisible();
    await expect(subscriptions.form.error('principalId')).toHaveText(
      t('alertSubscriptions.invalidPrincipalId')
    );
    await subscriptions.form.cancel();
  });

  test('a manager overrides a notification template and deletes the override', async ({
    page,
    shell,
    t,
    cleanup,
  }) => {
    const templates = new CrudFlow(page, 'notification-templates', t);
    const body = `E2E template body ${unique()}`;

    await shell.open('manageAdmin');
    await templates.open();

    await templates.section.clickAdd();
    await templates.form.waitOpen();
    await templates.form.select('templateKey', t('notificationTemplates.keys.testNotification'));
    await templates.form.select('channel', t('notificationChannels.email'));
    await templates.form.select('locale', t('notificationTemplates.localeEn'));
    await templates.form.field('subject').fill(`E2E subject ${unique()}`);
    await templates.form.field('body').fill(body);
    await templates.form.saveAndClose();

    const row = await templates.section.findRow(t('notificationTemplates.keys.testNotification'));
    await expect(row).toBeVisible();
    cleanup.add('notification template override', async () => {
      await shell.open('manageAdmin');
      await templates.open();
      const stale = templates.section.row(t('notificationTemplates.custom'));
      if ((await stale.count()) > 0) {
        await stale.getByRole('button', { name: t('generic.delete') }).click();
        await templates.confirm.confirm();
      }
    });

    await templates.reload(shell, 'manageAdmin');
    const custom = await templates.section.findRow(t('notificationTemplates.custom'));
    await custom.getByRole('button', { name: t('generic.delete') }).click();
    await templates.confirm.confirm();
    await expect(templates.section.row(t('notificationTemplates.custom'))).toHaveCount(0, {
      timeout: 45_000,
    });
  });

  test('the alert events section lists events and offers acknowledge/resolve', async ({
    page,
    shell,
    t,
  }) => {
    const events = new Section(page, 'alert-events', t);
    await shell.open('manageAdmin');
    await events.expand();

    // The list is ungated on purpose (other modules emit into it), and it may be
    // legitimately empty; what must always hold is the table's own structure.
    await expect(events.root.getByRole('columnheader', { name: t('alertEvents.type') })).toBeVisible();
    await expect(
      events.root.getByRole('columnheader', { name: t('alertEvents.status') })
    ).toBeVisible();

    const open = events.rows.filter({ hasText: t('alertEvents.statuses.Open') }).first();
    if ((await open.count()) > 0) {
      await expect(open.getByRole('button', { name: t('alertEvents.acknowledge') })).toBeVisible();
      await expect(open.getByRole('button', { name: t('alertEvents.resolve') })).toBeVisible();
    }
  });

  test('the delivery log renders its counters and filters', async ({ page, shell, t }) => {
    const deliveries = new Section(page, 'notification-deliveries', t);
    await shell.open('manageAdmin');
    await deliveries.expand();

    await expect(deliveries.root.getByText(t('notificationDeliveries.sentCount'))).toBeVisible();
    await expect(deliveries.root.getByText(t('notificationDeliveries.failedCount'))).toBeVisible();
    await expect(deliveries.root.getByText(t('notificationDeliveries.pendingCount'))).toBeVisible();

    const statusFilter = deliveries.root.getByRole('combobox', {
      name: t('notificationDeliveries.filterStatus'),
    });
    await expect(statusFilter).toBeVisible();
    await statusFilter.click();
    await page.getByRole('option', { name: t('notificationDeliveries.statuses.failed') }).click();
    await expect(statusFilter).toContainText(t('notificationDeliveries.statuses.failed'));
  });
});
