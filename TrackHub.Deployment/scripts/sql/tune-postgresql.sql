-- =============================================================================
-- PostgreSQL settings TrackHub's workload depends on
-- =============================================================================
-- Run as a superuser against the server (not one database):
--
--   psql -h <host> -U postgres -d postgres -f tune-postgresql.sql
--   -- then reload, and restart for shared_buffers / max_connections:
--   SELECT pg_reload_conf();
--
-- The memory settings below are expressed against TOTAL RAM and have to be set
-- by hand; everything else is absolute and applied here. Every value is written
-- with ALTER SYSTEM, so it lands in postgresql.auto.conf and survives restarts.
-- =============================================================================

\set ON_ERROR_STOP on

-- The defaults assume a spinning disk. On SSD a random read costs barely more
-- than a sequential one, and 4.0 is what pushes the planner onto a sequential
-- scan of a fact table when an index scan of one account would do.
ALTER SYSTEM SET random_page_cost = 1.1;

-- A build without posix_fadvise (Windows) rejects any value but 0 at assign time, and reports a
-- max_val of 1000 anyway — so there is nothing to test beforehand. The rejection is tolerated here
-- rather than allowed to abort everything below it.
\set ON_ERROR_STOP off
ALTER SYSTEM SET effective_io_concurrency = 200;
\set ON_ERROR_STOP on

-- Retention and ingest generate WAL in bursts; 1 GB forces a checkpoint in the
-- middle of one, which is when the write stall shows up as a request timeout.
ALTER SYSTEM SET max_wal_size = '8GB';
ALTER SYSTEM SET min_wal_size = '2GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- Tenant sizes are skewed by orders of magnitude, so the default 100-bucket
-- histogram models accountid badly and the planner mis-estimates every account
-- predicate on a shared fact table.
ALTER SYSTEM SET default_statistics_target = 100;

-- Most TrackHub queries finish in under a millisecond, where JIT compilation
-- costs more than the plan it compiles.
ALTER SYSTEM SET jit_above_cost = 500000;

ALTER SYSTEM SET autovacuum_vacuum_cost_delay = '1ms';
ALTER SYSTEM SET autovacuum_naptime = '30s';
ALTER SYSTEM SET autovacuum_max_workers = 5;

-- Slow-query visibility. Without it there is no record of which statement was
-- slow, only that something was.
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET log_autovacuum_min_duration = '10s';

SELECT pg_reload_conf();

-- ---------------------------------------------------------------------------
-- Per-column statistics: accountid is the predicate on every multi-tenant read,
-- and one large tenant among many is exactly the distribution the default
-- histogram resolution cannot represent.
-- ---------------------------------------------------------------------------
\c TrackHub

ALTER TABLE telemetry.transporter_position_history ALTER COLUMN accountid SET STATISTICS 500;
ANALYZE telemetry.transporter_position_history;

-- ---------------------------------------------------------------------------
-- Set by hand in postgresql.conf, sized against this host's RAM, then restart:
--
--   shared_buffers        = 25% of RAM
--   effective_cache_size  = 50-75% of RAM
--   work_mem              = 16MB..64MB   (per sort/hash node, per connection)
--   maintenance_work_mem  = 1GB..2GB     (index builds, REINDEX, VACUUM)
--   max_connections       = sum of every service's Maximum Pool Size, + 20%
--
-- The pool ceiling is 20 per service by default (Database:MaxPoolSize), so a
-- deployment of twenty services needs max_connections >= 480. Npgsql pools per
-- distinct connection string PER PROCESS: count processes, not services.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Two consequences of auto-prepare (`Database:MaxAutoPrepare`, 20 by default):
--
--   * PgBouncer in TRANSACTION mode cannot carry prepared statements. Put
--     `Max Auto Prepare=0` in the connection string before moving behind one.
--   * A prepared statement caches the result shape it was planned against, so a
--     migration that alters a table a running service already queried can raise
--     "cached plan must not change result type" until its connections recycle.
--     Restart the affected services after a shape-changing migration.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- OPTIONAL, and a deliberate trade-off — not applied above.
--
-- telemetry.transporter_position is a DERIVED projection: one row per vehicle,
-- rewritten by every sync cycle and reconstructible from the next one. UNLOGGED
-- removes its WAL entirely, which on a 3 000-vehicle fleet at one-minute
-- cadence is the single largest write stream the table produces.
--
-- What it costs: PostgreSQL TRUNCATES an unlogged table on crash recovery. The
-- live map is then empty until the next sync cycle fills it — up to one polling
-- interval, typically 1-5 minutes. Nothing else reads the table, and no history
-- is lost (that lives in transporter_position_history, which stays logged).
--
-- Take it only if an empty live map for one polling interval after an unclean
-- shutdown is acceptable. It is reversible at any time.
--
--   ALTER TABLE telemetry.transporter_position SET UNLOGGED;   -- to enable
--   ALTER TABLE telemetry.transporter_position SET LOGGED;     -- to undo
--
-- Both rewrite the table and hold an ACCESS EXCLUSIVE lock for the duration;
-- at one row per vehicle that is sub-second.
-- ---------------------------------------------------------------------------
