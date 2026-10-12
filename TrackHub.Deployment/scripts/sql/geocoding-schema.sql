CREATE SCHEMA IF NOT EXISTS geocoding;

CREATE TABLE IF NOT EXISTS geocoding.adminarea (
    id serial PRIMARY KEY,
    source character varying(20) NOT NULL,
    sourceid character varying(60) NOT NULL,
    country character(2) NOT NULL,
    level smallint NOT NULL,
    name character varying(200) NOT NULL,
    countryname character varying(100),
    state character varying(100),
    city character varying(100),
    geom geometry(MultiPolygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS adminarea_level_idx ON geocoding.adminarea (level);
CREATE INDEX IF NOT EXISTS adminarea_geom_idx ON geocoding.adminarea USING gist (geom);

CREATE TABLE IF NOT EXISTS geocoding.adminareapart (
    areaid integer NOT NULL REFERENCES geocoding.adminarea (id) ON DELETE CASCADE,
    level smallint NOT NULL,
    geom geometry(Polygon, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS adminareapart_geom_idx ON geocoding.adminareapart USING gist (geom);

CREATE TABLE IF NOT EXISTS geocoding.roadsegment (
    id serial PRIMARY KEY,
    sourceid character varying(60) NOT NULL,
    name character varying(200) NOT NULL,
    class character varying(30),
    geom geometry(LineString, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS roadsegment_geom_idx ON geocoding.roadsegment USING gist (geom);

CREATE TABLE IF NOT EXISTS geocoding.place (
    id serial PRIMARY KEY,
    sourceid character varying(60) NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(60),
    landmark boolean NOT NULL,
    geom geometry(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS place_geom_idx ON geocoding.place USING gist (geom);

CREATE TABLE IF NOT EXISTS geocoding.settlement (
    id serial PRIMARY KEY,
    sourceid character varying(60) NOT NULL,
    kind character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    geom geometry(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS settlement_geom_idx ON geocoding.settlement USING gist (geom);

-- Outside every polygon (coast, GPS drift) the nearest municipio within ~5 km is used; beyond that there is no address.
CREATE OR REPLACE FUNCTION geocoding.reverse_geocode(p_lat double precision, p_lon double precision)
 RETURNS TABLE(address character varying, city character varying, state character varying, country character varying)
 LANGUAGE plpgsql
 STABLE PARALLEL SAFE
AS $function$
DECLARE
    v_point geometry := ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326);
    v_level smallint;
    v_name character varying;
    v_city character varying;
    v_state character varying;
    v_country character varying;
    v_place character varying;
    v_road character varying;
    v_barrio character varying;
    v_zones character varying;
    v_has_barrio boolean;
BEGIN
    WITH c AS MATERIALIZED (
        SELECT DISTINCT ON (a.id) a.id, a.level, a.name, a.city, a.state, a.countryname
        FROM geocoding.adminareapart p
        JOIN geocoding.adminarea a ON a.id = p.areaid
        WHERE ST_Contains(p.geom, v_point)),
    d AS (SELECT * FROM c ORDER BY c.level DESC, c.id LIMIT 1)
    SELECT d.level, d.name, d.city, d.state, d.countryname,
           (SELECT string_agg(z.name, ', ' ORDER BY z.level DESC, z.name)
            FROM (SELECT DISTINCT c.name, c.level FROM c
                  WHERE c.level BETWEEN 3 AND 5 AND NOT (c.level = 3 AND c.name ILIKE split_part(d.city, ',', 1) || '%')) z),
           EXISTS (SELECT 1 FROM c WHERE c.level = 5)
    INTO v_level, v_name, v_city, v_state, v_country, v_zones, v_has_barrio
    FROM d;

    IF NOT FOUND THEN
        RETURN QUERY
        SELECT a.name, a.city, a.state, a.countryname
        FROM geocoding.adminarea a
        WHERE a.level = 2 AND ST_DWithin(a.geom, v_point, 0.045)
        ORDER BY a.geom <-> v_point
        LIMIT 1;
        RETURN;
    END IF;

    IF v_level = 6 THEN
        v_place := v_name;
    ELSE
        SELECT pl.name INTO v_place
        FROM geocoding.place pl
        WHERE ST_DWithin(pl.geom, v_point, 0.00055) AND (pl.landmark OR ST_DWithin(pl.geom, v_point, 0.00027))
          AND translate(lower(pl.name), 'áéíóú', 'aeiou') <> translate(lower(coalesce(v_city, '')), 'áéíóú', 'aeiou')
        ORDER BY pl.geom <-> v_point
        LIMIT 1;
    END IF;

    SELECT r.name INTO v_road
    FROM geocoding.roadsegment r
    WHERE ST_DWithin(r.geom, v_point, 0.003)
    ORDER BY r.geom <-> v_point
    LIMIT 1;

    IF NOT v_has_barrio THEN
        SELECT s.name INTO v_barrio
        FROM geocoding.settlement s
        WHERE s.kind IN ('neighborhood', 'microhood') AND ST_DWithin(s.geom, v_point, 0.0036)
        ORDER BY s.geom <-> v_point
        LIMIT 1;
        IF v_barrio IS NULL THEN
            SELECT s.name INTO v_barrio
            FROM geocoding.settlement s
            WHERE s.kind = 'macrohood' AND ST_DWithin(s.geom, v_point, 0.018)
            ORDER BY s.geom <-> v_point
            LIMIT 1;
        END IF;
        IF v_barrio IS NULL AND v_zones IS NULL THEN
            SELECT s.name INTO v_barrio
            FROM geocoding.settlement s
            WHERE s.kind = 'locality' AND ST_DWithin(s.geom, v_point, 0.018)
            ORDER BY s.geom <-> v_point
            LIMIT 1;
        END IF;
    END IF;

    RETURN QUERY SELECT
        coalesce(nullif(concat_ws(', ', v_place, v_road, v_barrio, v_zones), ''), v_name)::character varying,
        v_city, v_state, v_country;
END;
$function$;
