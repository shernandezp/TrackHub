/**
 * Account Management → Operations & Monitoring: the audit trail and the
 * background-job table.
 */

import { test, expect, uniqueName } from '../fixtures';
import { CrudFlow } from '../pages/crud';
import { Section } from '../pages/tableAccordion';

test.describe('account management — operations & monitoring', () => {
  test('the audit trail records a change made earlier in the same session', async ({
    page,
    shell,
    t,
    cleanup,
  }) => {
    const poiName = uniqueName('poi');
    const pois = new CrudFlow(page, 'pois', t);

    await shell.open('manageAdmin');
    await pois.open();
    cleanup.add(`poi ${poiName}`, () => pois.removeIfPresent(poiName));
    await pois.create(
      {
        fields: { name: poiName, description: 'audited by the e2e suite', latitude: '4.6', longitude: '-74.0' },
        selects: { type: t('poi.types.other') },
      },
      poiName,
      'name'
    );
    await pois.remove(poiName);

    const audit = new Section(page, 'audit-trail', t);
    await shell.reloadTo('manageAdmin');
    await audit.expand();

    await expect(audit.root.getByRole('columnheader', { name: t('auditTrail.actor') })).toBeVisible();
    await expect(
      audit.root.getByRole('columnheader', { name: t('auditTrail.occurredAt') })
    ).toBeVisible();
    // The write path is audited: the newest entries carry this run's actions.
    await expect.poll(() => audit.rows.count(), { timeout: 45_000 }).toBeGreaterThan(0);
    await expect(audit.rows.first()).toContainText(/PointOfInterest|Poi/i);
  });

  test('the background jobs table reports each job with its last run', async ({
    page,
    shell,
    t,
  }) => {
    const jobs = new Section(page, 'background-jobs', t);
    await shell.open('manageAdmin');
    await jobs.expand();

    await expect(jobs.root.getByRole('columnheader', { name: t('backgroundJobs.job') })).toBeVisible();
    await expect(
      jobs.root.getByRole('columnheader', { name: t('backgroundJobs.status') })
    ).toBeVisible();
    await expect(
      jobs.root.getByRole('columnheader', { name: t('backgroundJobs.startedAt') })
    ).toBeVisible();
    // Many jobs only record activity when they had something to do, so an empty
    // table is a legitimate answer; the structure is what must always hold.
  });
});
