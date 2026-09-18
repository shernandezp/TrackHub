\set ON_ERROR_STOP on

DO $$
DECLARE
    src regclass := 'telemetry.transporter_position_history'::regclass;
    lo date;
    hi date;
    m date;
    part text;
    moved bigint;
BEGIN
    IF (SELECT relkind FROM pg_class WHERE oid = src) = 'p' THEN
        RAISE NOTICE 'transporter_position_history is already partitioned; nothing to do.';
        RETURN;
    END IF;

    SELECT date_trunc('month', COALESCE(min(sourcetimestamp), now()))::date,
           date_trunc('month', COALESCE(max(sourcetimestamp), now()) + interval '3 months')::date
      INTO lo, hi
      FROM telemetry.transporter_position_history;

    EXECUTE 'ALTER TABLE telemetry.transporter_position_history RENAME TO transporter_position_history_migrating';

    FOR part IN SELECT indexname FROM pg_indexes
                WHERE schemaname = 'telemetry' AND tablename = 'transporter_position_history_migrating'
    LOOP
        EXECUTE format('ALTER INDEX telemetry.%I RENAME TO %I', part, part || '_migrating');
    END LOOP;

    EXECUTE '
        CREATE TABLE telemetry.transporter_position_history (
            LIKE telemetry.transporter_position_history_migrating
            INCLUDING DEFAULTS INCLUDING STORAGE INCLUDING CONSTRAINTS
        ) PARTITION BY RANGE (sourcetimestamp)';

    EXECUTE 'ALTER TABLE telemetry.transporter_position_history
             ADD CONSTRAINT "PK_transporter_position_history" PRIMARY KEY (id, sourcetimestamp)';
    EXECUTE 'CREATE UNIQUE INDEX "IX_transporter_position_history_idempotencykey_sourcetimestamp"
             ON telemetry.transporter_position_history (idempotencykey, sourcetimestamp)';
    EXECUTE 'CREATE INDEX "IX_transporter_position_history_accountid_sourcetimestamp"
             ON telemetry.transporter_position_history (accountid, sourcetimestamp DESC)';
    EXECUTE 'CREATE INDEX "IX_transporter_position_history_accountid_deviceid_sourcetim~"
             ON telemetry.transporter_position_history (accountid, deviceid, sourcetimestamp)';
    EXECUTE 'CREATE INDEX "IX_transporter_position_history_accountid_transporterid_source~"
             ON telemetry.transporter_position_history (accountid, transporterid, sourcetimestamp)';

    EXECUTE 'CREATE TABLE telemetry.transporter_position_history_default
             PARTITION OF telemetry.transporter_position_history DEFAULT';

    m := lo;
    WHILE m <= hi LOOP
        part := 'tph_' || to_char(m, 'YYYYMM');
        EXECUTE format(
            'CREATE TABLE telemetry.%I PARTITION OF telemetry.transporter_position_history
             FOR VALUES FROM (%L) TO (%L)', part, m, (m + interval '1 month')::date);
        m := (m + interval '1 month')::date;
    END LOOP;

    EXECUTE 'INSERT INTO telemetry.transporter_position_history
             SELECT * FROM telemetry.transporter_position_history_migrating';
    GET DIAGNOSTICS moved = ROW_COUNT;

    EXECUTE 'DROP TABLE telemetry.transporter_position_history_migrating';

    RAISE NOTICE 'Partitioned transporter_position_history: % row(s) moved into monthly partitions.', moved;
END $$;

ANALYZE telemetry.transporter_position_history;
