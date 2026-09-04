/**
 * Test-data identity and cleanup.
 *
 * Every row a test creates carries `e2e-<runId>-<n>` in the field a human reads
 * (name, code, email), where `runId` is the run's start time in base 36. Two
 * consequences the suite depends on:
 *  - a run can always find its own rows, and only its own;
 *  - a row's AGE is derivable from its name, so a global sweep can delete what a
 *    crashed earlier run abandoned without touching a run in flight.
 */

const RUN_ID: string = process.env.E2E_RUN_ID ?? Date.now().toString(36);
let counter = 0;

/** `e2e-<runId>-<n>` — unique within the run, recognisable across runs. */
export function unique(): string {
  counter += 1;
  return `e2e-${RUN_ID}-${counter}`;
}

/** A name carrying the run marker, e.g. `unit e2e-m4x9q2-3`. */
export function uniqueName(label: string): string {
  return `${label} ${unique()}`;
}

/** A unique e-mail address inside the run, for user-creation flows. */
export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}.${unique()}@e2e.trackhub.local`;
}

/** Matches any name/code this suite has ever produced. */
export const E2E_PATTERN = /e2e-([0-9a-z]+)-(\d+)/;

/** Milliseconds since a marked row was created, or `null` when unmarked. */
export function ageOf(text: string | null | undefined): number | null {
  const match = text ? E2E_PATTERN.exec(text) : null;
  if (!match) return null;
  const created = parseInt(match[1], 36);
  return Number.isFinite(created) ? Date.now() - created : null;
}

/**
 * True for a marked row created by an earlier run more than `olderThanMs` ago.
 *
 * The AGE is what protects a run in flight, not the id: each process gets its
 * own `RUN_ID` (the teardown's differs from the workers'), so the id check below
 * only ever short-circuits rows this same process made.
 */
export function isStale(text: string | null | undefined, olderThanMs = 60 * 60 * 1000): boolean {
  if (text?.includes(`e2e-${RUN_ID}-`)) return false;
  const age = ageOf(text);
  return age !== null && age > olderThanMs;
}

export type CleanupStep = () => Promise<void>;

/**
 * LIFO cleanup registry. A test registers the undo for each row it creates as
 * soon as the row exists, so an assertion failure later still releases it.
 */
export class CleanupRegistry {
  private readonly steps: { label: string; run: CleanupStep }[] = [];

  add(label: string, run: CleanupStep): void {
    this.steps.push({ label, run });
  }

  /** Runs every registered step, newest first. Failures are collected, never thrown. */
  async runAll(): Promise<string[]> {
    const failures: string[] = [];
    while (this.steps.length > 0) {
      const step = this.steps.pop()!;
      try {
        await step.run();
      } catch (error) {
        failures.push(`${step.label}: ${(error as Error).message}`);
      }
    }
    return failures;
  }
}
