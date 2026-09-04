/**
 * Global teardown: leave the account exactly as the run found it.
 *
 * Two jobs, in order:
 *  1. delete the manager/user principals the setup project created itself
 *     (`e2e/.auth/created.json`) — they are real accounts users, not fixtures;
 *  2. sweep `e2e-*` rows an earlier, crashed run abandoned.
 *
 * Nothing here throws: a teardown failure must not turn a green run red, but it
 * must be visible, so every failure is printed.
 */

import fs from 'node:fs';
import { ApiClient } from './fixtures/api';
import { sweep } from './fixtures/sweep';
import { readCreated, authFiles } from './fixtures/auth';
import { flag } from './fixtures/env';

async function globalTeardown(): Promise<void> {
  const api = new ApiClient('admin');
  if (!api.available) return;

  try {
    for (const principal of readCreated()) {
      const deleted = await api.tryGql(
        'security',
        'mutation($id: UUID!) { deleteUser(id: $id) }',
        { id: principal.userId }
      );
      console.log(
        deleted
          ? `[teardown] removed the ${principal.role} principal ${principal.email}`
          : `[teardown] FAILED to remove the ${principal.role} principal ${principal.email}`
      );
    }
    if (fs.existsSync(authFiles.createdFile)) fs.rmSync(authFiles.createdFile);

    // The run's own rows are released by the tests that created them; anything
    // still marked is either from this run's failures (with E2E_SWEEP_ALL=1) or
    // from an earlier run that never got to clean up.
    const report = await sweep(api, { includeCurrentRun: flag('E2E_SWEEP_ALL') });
    if (report.deleted.length > 0) {
      console.log(`[teardown] swept ${report.deleted.length} leftover row(s): ${report.deleted.join(', ')}`);
    }
    if (report.failed.length > 0) {
      console.log(`[teardown] could NOT sweep: ${report.failed.join(', ')}`);
    }
  } catch (error) {
    console.log(`[teardown] skipped: ${(error as Error).message}`);
  } finally {
    await api.dispose();
  }
}

export default globalTeardown;
