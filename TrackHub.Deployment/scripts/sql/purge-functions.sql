CREATE SCHEMA IF NOT EXISTS ops;

CREATE OR REPLACE FUNCTION ops.delete_chunked(p_sql text, p_chunk int DEFAULT 5000)
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE removed bigint; total bigint := 0;
BEGIN
    LOOP
        EXECUTE format(p_sql, p_chunk);
        GET DIAGNOSTICS removed = ROW_COUNT;
        total := total + removed;
        EXIT WHEN removed = 0;
    END LOOP;
    RETURN total;
END $$;

CREATE OR REPLACE FUNCTION ops.position_retention_days(p_now timestamptz DEFAULT now())
RETURNS TABLE(accountid uuid, retention_days int) LANGUAGE sql STABLE AS $$
    SELECT DISTINCT ON (f.accountid)
           f.accountid,
           COALESCE(NULLIF((f.configurationjson::jsonb ->> 'retentionDays'), '')::int, 30)
    FROM app.account_features f
    WHERE f.featurekey = 'gps.positionHistory'
      AND f.enabled
      AND (f.effectivefrom IS NULL OR f.effectivefrom <= p_now)
      AND (f.effectiveto   IS NULL OR f.effectiveto   >= p_now)
      AND (f.configurationjson IS NULL OR jsonb_typeof(f.configurationjson::jsonb) = 'object')
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

CREATE OR REPLACE FUNCTION ops.maintain_position_partitions(p_now timestamptz DEFAULT now())
RETURNS TABLE(action text, partition_name text) LANGUAGE plpgsql AS $$
DECLARE longest int; cutoff timestamptz; m date; part text; rec record;
BEGIN
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
            BEGIN
                EXECUTE format(
                    'CREATE TABLE telemetry.%I PARTITION OF telemetry.transporter_position_history
                     FOR VALUES FROM (%L) TO (%L)', part, m, (m + interval '1 month')::date);
                action := 'created'; partition_name := part; RETURN NEXT;
            EXCEPTION WHEN invalid_object_definition OR duplicate_table THEN
                NULL;
            END;
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

    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_inherits inh ON inh.inhrelid = c.oid
               WHERE inh.inhparent = 'telemetry.transporter_position_history'::regclass
                 AND c.relname = 'transporter_position_history_legacy')
       AND NOT EXISTS (SELECT 1 FROM telemetry.transporter_position_history_legacy LIMIT 1) THEN
        EXECUTE 'DROP TABLE telemetry.transporter_position_history_legacy';
        action := 'dropped'; partition_name := 'transporter_position_history_legacy'; RETURN NEXT;
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
               WHERE "Created" < %L AND status IN ('Sent', 'Failed', 'Digested') LIMIT %%s)$q$,
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
END $$;
