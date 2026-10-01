CREATE SCHEMA IF NOT EXISTS ops;

CREATE OR REPLACE FUNCTION ops.delete_chunked(p_sql text, p_chunk int DEFAULT 5000)
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE removed bigint; total bigint := 0; chunks int := 0;
        budget int := NULLIF(current_setting('ops.max_chunks', true), '')::int;
BEGIN
    LOOP
        EXECUTE format(p_sql, p_chunk);
        GET DIAGNOSTICS removed = ROW_COUNT;
        total := total + removed;
        chunks := chunks + 1;
        EXIT WHEN removed = 0 OR chunks >= budget;
    END LOOP;
    RETURN total;
END $$;

-- Operator-edited JSON: text that does not parse is treated as absent, never as an error that would
-- abort the purge for every account.
CREATE OR REPLACE FUNCTION ops.try_jsonb(p_text text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN p_text::jsonb;
EXCEPTION WHEN others THEN
    RETURN NULL;
END $$;

-- Mirrors the settings catalog: an integer from 1 to 3650, anything else is the 30-day default.
CREATE OR REPLACE FUNCTION ops.position_retention_days(p_now timestamptz DEFAULT now())
RETURNS TABLE(accountid uuid, retention_days int) LANGUAGE sql STABLE AS $$
    SELECT DISTINCT ON (f.accountid)
           f.accountid,
           CASE WHEN (ops.try_jsonb(f.configurationjson) ->> 'retentionDays') ~ '^[0-9]{1,4}$'
                THEN CASE WHEN (ops.try_jsonb(f.configurationjson) ->> 'retentionDays')::int BETWEEN 1 AND 3650
                          THEN (ops.try_jsonb(f.configurationjson) ->> 'retentionDays')::int
                          ELSE 30 END
                ELSE 30 END
    FROM app.account_features f
    WHERE f.featurekey = 'gps.positionHistory'
      AND f.enabled
      AND (f.effectivefrom IS NULL OR f.effectivefrom <= p_now)
      AND (f.effectiveto   IS NULL OR f.effectiveto   >= p_now)
    ORDER BY f.accountid, f.effectivefrom DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION ops.purge_position_history(p_now timestamptz DEFAULT now())
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE acct uuid; days int; cutoff timestamptz; total bigint := 0;
BEGIN
    FOR acct IN
        WITH RECURSIVE holders AS (
            SELECT (SELECT t.accountid FROM telemetry.transporter_position_history t
                    ORDER BY t.accountid LIMIT 1) AS accountid
            UNION ALL
            SELECT (SELECT h.accountid FROM telemetry.transporter_position_history h
                    WHERE h.accountid > holders.accountid ORDER BY h.accountid LIMIT 1)
            FROM holders WHERE holders.accountid IS NOT NULL)
        SELECT accountid FROM holders WHERE accountid IS NOT NULL
    LOOP
        SELECT r.retention_days INTO days FROM ops.position_retention_days(p_now) r WHERE r.accountid = acct;
        cutoff := p_now - make_interval(days => COALESCE(days, 30));

        total := total + ops.delete_chunked(format(
            $q$DELETE FROM telemetry.transporter_position_history
               WHERE (id, sourcetimestamp) IN (
                   SELECT id, sourcetimestamp FROM telemetry.transporter_position_history
                   WHERE accountid = %L AND sourcetimestamp < %L LIMIT %%s)$q$, acct, cutoff));
    END LOOP;
    RETURN total;
END $$;

-- Month bounds are UTC midnights whatever zone the caller's session has.
CREATE OR REPLACE FUNCTION ops.maintain_position_partitions(p_now timestamptz DEFAULT now())
RETURNS TABLE(action text, partition_name text) LANGUAGE plpgsql SET timezone TO 'UTC' AS $$
DECLARE longest int; cutoff timestamptz; m date; part text; rec record; legacy_empty boolean; moved bigint;
BEGIN
    IF (SELECT relkind FROM pg_class WHERE oid = to_regclass('telemetry.transporter_position_history')) IS DISTINCT FROM 'p' THEN
        RETURN;
    END IF;

    SELECT GREATEST(30, COALESCE(max(r.retention_days), 30)) INTO longest
    FROM ops.position_retention_days(p_now) r;
    cutoff := p_now - make_interval(days => longest);

    FOR m IN
        SELECT generate_series(
            date_trunc('month', p_now - make_interval(days => longest)),
            date_trunc('month', p_now + interval '3 months'),
            interval '1 month')::date
    LOOP
        part := 'tph_' || to_char(m, 'YYYYMM');
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                       WHERE n.nspname = 'telemetry' AND c.relname = part) THEN
            -- Rows that landed in DEFAULT for this month would make PostgreSQL refuse the new
            -- partition, so they move into it first and it is attached afterwards.
            moved := 0;
            IF to_regclass('telemetry.transporter_position_history_default') IS NOT NULL THEN
                LOCK TABLE telemetry.transporter_position_history_default IN SHARE ROW EXCLUSIVE MODE;
                EXECUTE 'SELECT count(*) FROM telemetry.transporter_position_history_default
                         WHERE sourcetimestamp >= $1 AND sourcetimestamp < $2'
                    INTO moved USING m::timestamptz, (m + interval '1 month')::timestamptz;
            END IF;

            IF moved > 0 THEN
                EXECUTE format('CREATE TABLE telemetry.%I (LIKE telemetry.transporter_position_history INCLUDING DEFAULTS INCLUDING CONSTRAINTS)', part);
                EXECUTE format(
                    'WITH gone AS (DELETE FROM telemetry.transporter_position_history_default
                                   WHERE sourcetimestamp >= %L AND sourcetimestamp < %L RETURNING *)
                     INSERT INTO telemetry.%I SELECT * FROM gone', m, (m + interval '1 month')::date, part);
                EXECUTE format(
                    'ALTER TABLE telemetry.transporter_position_history ATTACH PARTITION telemetry.%I
                     FOR VALUES FROM (%L) TO (%L)', part, m, (m + interval '1 month')::date);
                action := 'created from ' || moved || ' default row(s)'; partition_name := part; RETURN NEXT;
            ELSE
                BEGIN
                    EXECUTE format(
                        'CREATE TABLE telemetry.%I PARTITION OF telemetry.transporter_position_history
                         FOR VALUES FROM (%L) TO (%L)', part, m, (m + interval '1 month')::date);
                    action := 'created'; partition_name := part; RETURN NEXT;
                EXCEPTION WHEN invalid_object_definition OR duplicate_table THEN
                    NULL;
                END;
            END IF;
        END IF;

    END LOOP;

    FOR rec IN
        SELECT c.relname FROM pg_class c
        JOIN pg_inherits inh ON inh.inhrelid = c.oid
        WHERE inh.inhparent = 'telemetry.transporter_position_history'::regclass
          AND c.relname ~ '^tph_[0-9]{6}$'
    LOOP
        IF to_date(right(rec.relname, 6), 'YYYYMM') + interval '1 month' <= cutoff THEN
            EXECUTE format('DROP TABLE telemetry.%I', rec.relname);
            action := 'dropped'; partition_name := rec.relname; RETURN NEXT;
        END IF;
    END LOOP;

    -- The legacy table is referenced dynamically: a static reference fails to plan once it is gone.
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_inherits inh ON inh.inhrelid = c.oid
               WHERE inh.inhparent = 'telemetry.transporter_position_history'::regclass
                 AND c.relname = 'transporter_position_history_legacy') THEN
        EXECUTE 'SELECT NOT EXISTS (SELECT 1 FROM telemetry.transporter_position_history_legacy LIMIT 1)' INTO legacy_empty;
        IF legacy_empty THEN
            EXECUTE 'DROP TABLE telemetry.transporter_position_history_legacy';
            action := 'dropped'; partition_name := 'transporter_position_history_legacy'; RETURN NEXT;
        END IF;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION ops.purge_job_runs(p_now timestamptz DEFAULT now(), p_days int DEFAULT 90)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM app.background_job_runs
           WHERE id IN (
               SELECT r.id FROM app.background_job_runs r
               WHERE r.status = 'Succeeded'
                 AND r.startedat < %L
                 AND r.jobkey NOT IN ('workforce-expiration-scan', 'document-expiration')
                 AND r.id <> (SELECT r2.id FROM app.background_job_runs r2
                              WHERE r2.jobkey = r.jobkey
                              ORDER BY r2.startedat DESC, r2.id DESC LIMIT 1)
               LIMIT %%s)$q$, p_now - make_interval(days => GREATEST(1, p_days))));
$$;

CREATE OR REPLACE FUNCTION ops.purge_alert_events(p_now timestamptz DEFAULT now(), p_days int DEFAULT 180)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM app.alert_events
           WHERE id IN (
               SELECT e.id FROM app.alert_events e
               WHERE e.status = 'Resolved' AND e.lastseenat < %L
                 AND NOT EXISTS (SELECT 1 FROM app.notification_deliveries d WHERE d.alerteventid = e.id)
               LIMIT %%s)$q$, p_now - make_interval(days => GREATEST(1, p_days))));
$$;

CREATE OR REPLACE FUNCTION ops.purge_audit_events(p_now timestamptz DEFAULT now(), p_days int DEFAULT 730)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM app.audit_events
           WHERE id IN (SELECT id FROM app.audit_events WHERE occurredat < %L LIMIT %%s)$q$,
        p_now - make_interval(days => GREATEST(1, p_days))));
$$;

CREATE OR REPLACE FUNCTION ops.purge_notification_deliveries(p_now timestamptz DEFAULT now(), p_days int DEFAULT 90)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM app.notification_deliveries
           WHERE id IN (
               SELECT id FROM app.notification_deliveries
               WHERE "Created" < %L AND status IN ('Sent', 'Failed', 'Digested', 'Expired') LIMIT %%s)$q$,
        p_now - make_interval(days => GREATEST(1, p_days))));
$$;

CREATE OR REPLACE FUNCTION ops.purge_api_usage_hours(p_now timestamptz DEFAULT now(), p_days int DEFAULT 400)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM app.api_usage_hours
           WHERE id IN (SELECT id FROM app.api_usage_hours WHERE hourutc < %L LIMIT %%s)$q$,
        p_now - make_interval(days => GREATEST(1, p_days))));
$$;

CREATE OR REPLACE FUNCTION ops.purge_trip_events(p_now timestamptz DEFAULT now(), p_days int DEFAULT 730)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM trip.trip_events
           WHERE id IN (
               SELECT e.id FROM trip.trip_events e
               JOIN trip.trips t ON t.id = e.tripid
               WHERE e.occurredat < %L AND t.status IN ('Completed', 'Cancelled', 'Aborted')
               LIMIT %%s)$q$, p_now - make_interval(days => GREATEST(1, p_days))));
$$;

-- Whatever its age, a row is kept while it is an operator's newest of a kind the readers look up:
-- per result, per trigger, the last run that saw devices and the last that read positions, and per
-- check type and status for health checks.
CREATE OR REPLACE FUNCTION ops.purge_operator_sync_runs(p_now timestamptz DEFAULT now(), p_days int DEFAULT 90)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM telemetry.operator_sync_runs
           WHERE id IN (
               SELECT r.id FROM telemetry.operator_sync_runs r
               WHERE r.startedat < %L
                 AND EXISTS (SELECT 1 FROM telemetry.operator_sync_runs n
                             WHERE n.operatorid = r.operatorid AND n.startedat > r.startedat AND n.result = r.result)
                 AND EXISTS (SELECT 1 FROM telemetry.operator_sync_runs n
                             WHERE n.operatorid = r.operatorid AND n.startedat > r.startedat AND n.triggertype = r.triggertype)
                 AND (r.devicesseen = 0 OR EXISTS (SELECT 1 FROM telemetry.operator_sync_runs n
                             WHERE n.operatorid = r.operatorid AND n.startedat > r.startedat AND n.devicesseen > 0))
                 AND (r.positionsread = 0 OR EXISTS (SELECT 1 FROM telemetry.operator_sync_runs n
                             WHERE n.operatorid = r.operatorid AND n.startedat > r.startedat AND n.positionsread > 0))
               LIMIT %%s)$q$, p_now - make_interval(days => GREATEST(1, p_days))));
$$;

CREATE OR REPLACE FUNCTION ops.purge_operator_health_checks(p_now timestamptz DEFAULT now(), p_days int DEFAULT 30)
RETURNS bigint LANGUAGE sql AS $$
    SELECT ops.delete_chunked(format(
        $q$DELETE FROM telemetry.operator_health_checks
           WHERE id IN (
               SELECT c.id FROM telemetry.operator_health_checks c
               WHERE c.startedat < %L
                 AND EXISTS (SELECT 1 FROM telemetry.operator_health_checks n
                             WHERE n.operatorid = c.operatorid AND n.startedat > c.startedat
                               AND n.checktype = c.checktype AND n.status = c.status)
               LIMIT %%s)$q$, p_now - make_interval(days => GREATEST(1, p_days))));
$$;

CREATE OR REPLACE FUNCTION ops.purge_all(p_now timestamptz DEFAULT now())
RETURNS TABLE(task text, affected bigint) LANGUAGE plpgsql AS $$
BEGIN
    task := 'partitions';              affected := (SELECT count(*) FROM ops.maintain_position_partitions(p_now)); RETURN NEXT;
    task := 'position_history';        affected := ops.purge_position_history(p_now);        RETURN NEXT;
    task := 'job_runs';                affected := ops.purge_job_runs(p_now);                RETURN NEXT;
    task := 'alert_events';            affected := ops.purge_alert_events(p_now);            RETURN NEXT;
    task := 'audit_events';            affected := ops.purge_audit_events(p_now);            RETURN NEXT;
    task := 'notification_deliveries'; affected := ops.purge_notification_deliveries(p_now); RETURN NEXT;
    task := 'api_usage_hours';         affected := ops.purge_api_usage_hours(p_now);         RETURN NEXT;
    task := 'trip_events';             affected := ops.purge_trip_events(p_now);             RETURN NEXT;
    task := 'operator_sync_runs';      affected := ops.purge_operator_sync_runs(p_now);      RETURN NEXT;
    task := 'operator_health_checks';  affected := ops.purge_operator_health_checks(p_now);  RETURN NEXT;
END $$;

-- The scheduled entry point: every task runs in its own transaction, so one that fails is reported
-- and the rest still run, and every chunk of deletes is committed as soon as it is done.
--     psql -d TrackHub -c "CALL ops.run_purge();"
CREATE OR REPLACE PROCEDURE ops.run_purge(p_now timestamptz DEFAULT now())
LANGUAGE plpgsql AS $$
DECLARE
    tasks text[] := ARRAY[
        'partitions', 'position_history', 'job_runs', 'alert_events', 'audit_events',
        'notification_deliveries', 'api_usage_hours', 'trip_events',
        'operator_sync_runs', 'operator_health_checks'];
    calls text[] := ARRAY[
        'SELECT count(*) FROM ops.maintain_position_partitions($1)', 'SELECT ops.purge_position_history($1)',
        'SELECT ops.purge_job_runs($1)', 'SELECT ops.purge_alert_events($1)', 'SELECT ops.purge_audit_events($1)',
        'SELECT ops.purge_notification_deliveries($1)', 'SELECT ops.purge_api_usage_hours($1)',
        'SELECT ops.purge_trip_events($1)',
        'SELECT ops.purge_operator_sync_runs($1)', 'SELECT ops.purge_operator_health_checks($1)'];
    affected bigint;
    total bigint;
BEGIN
    PERFORM set_config('ops.max_chunks', '1', false);
    FOR i IN 1 .. array_length(tasks, 1) LOOP
        total := 0;
        LOOP
            BEGIN
                EXECUTE calls[i] INTO affected USING p_now;
            EXCEPTION WHEN others THEN
                RAISE WARNING '% failed: %', tasks[i], SQLERRM;
                affected := 0;
            END;
            COMMIT;
            total := total + affected;
            EXIT WHEN affected = 0 OR tasks[i] = 'partitions';
        END LOOP;
        RAISE NOTICE '%: %', tasks[i], total;
    END LOOP;
    PERFORM set_config('ops.max_chunks', '', false);
END $$;
