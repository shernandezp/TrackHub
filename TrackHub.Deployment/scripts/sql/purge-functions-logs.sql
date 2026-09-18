CREATE SCHEMA IF NOT EXISTS ops;

CREATE OR REPLACE FUNCTION ops.purge_logs(p_now timestamptz DEFAULT now(), p_days int DEFAULT 30)
RETURNS bigint LANGUAGE plpgsql AS $$
DECLARE cutoff timestamp; removed bigint; total bigint := 0;
BEGIN
    cutoff := (p_now - make_interval(days => GREATEST(1, p_days))) AT TIME ZONE 'UTC';
    LOOP
        DELETE FROM public.logs
        WHERE ctid IN (SELECT ctid FROM public.logs WHERE raise_date < cutoff LIMIT 5000);
        GET DIAGNOSTICS removed = ROW_COUNT;
        total := total + removed;
        EXIT WHEN removed = 0;
    END LOOP;
    RETURN total;
END $$;
