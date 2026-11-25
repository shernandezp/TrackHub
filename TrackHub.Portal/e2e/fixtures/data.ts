/**
 * Every row a test creates carries `e2e-<runId>-<n>` (runId = run start time in
 * base 36) in its human-readable field, so a run finds only its own rows and a
 * sweep can derive a row's age from its name.
 */

const RUN_ID: string = process.env.E2E_RUN_ID ?? Date.now().toString(36);
let counter = 0;

/** `e2e-<runId>-<n>` — unique within the run, recognisable across runs. */
export function unique(): string {
  counter += 1;
  return `e2e-${RUN_ID}-${counter}`;
}

export function uniqueName(label: string): string {
  return `${label} ${unique()}`;
}

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}.${unique()}@e2e.trackhub.local`;
}

export const E2E_PATTERN = /e2e-([0-9a-z]+)-(\d+)/;

export function ageOf(text: string | null | undefined): number | null {
  const match = text ? E2E_PATTERN.exec(text) : null;
  if (!match) return null;
  const created = parseInt(match[1], 36);
  return Number.isFinite(created) ? Date.now() - created : null;
}

/**
 * The age is what protects a run in flight, not the id: each process gets its
 * own `RUN_ID` (the teardown's differs from the workers').
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

  /** Failures are collected, never thrown. */
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
