-- Builds the geocoding tables from the geocoding_stage tables in a side schema, then swaps them in.
ALTER TABLE geocoding_stage.adminarea ALTER COLUMN geom TYPE geometry USING ST_SetSRID(ST_GeomFromWKB(geom), 4326);
ALTER TABLE geocoding_stage.roadsegment ALTER COLUMN geom TYPE geometry USING ST_SetSRID(ST_GeomFromWKB(geom), 4326);
ALTER TABLE geocoding_stage.place ALTER COLUMN geom TYPE geometry USING ST_SetSRID(ST_GeomFromWKB(geom), 4326);
ALTER TABLE geocoding_stage.settlement ALTER COLUMN geom TYPE geometry USING ST_SetSRID(ST_GeomFromWKB(geom), 4326);

DROP SCHEMA IF EXISTS geocoding_load CASCADE;
CREATE SCHEMA geocoding_load;

CREATE FUNCTION geocoding_load.casing(p_name text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    SELECT regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(replace(p_name, 'D.c.', 'D.C.'),
        '(?<=[[:alpha:]]) De ', ' de ', 'g'), '(?<=[[:alpha:]]) Del ', ' del ', 'g'), '(?<=[[:alpha:]]) La ', ' la ', 'g'),
        '(?<=[[:alpha:]]) Las ', ' las ', 'g'), '(?<=[[:alpha:]]) Los ', ' los ', 'g'), '(?<=[[:alpha:]]) El ', ' el ', 'g'), '(?<=[[:alpha:]]) Y ', ' y ', 'g');
$function$;

CREATE TABLE geocoding_load.adminarea (
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

INSERT INTO geocoding_load.adminarea (source, sourceid, country, level, name, countryname, state, city, geom)
SELECT source, sourceid, country, level, CASE WHEN source = 'bogota' THEN geocoding_load.casing(initcap(name)) ELSE name END,
       countryname, state, city, ST_CollectionExtract(ST_MakeValid(geom), 3)
FROM geocoding_stage.adminarea
WHERE name IS NOT NULL AND name <> '';

CREATE INDEX ON geocoding_load.adminarea (level);
CREATE INDEX ON geocoding_load.adminarea USING gist (geom);

UPDATE geocoding_load.adminarea a
SET countryname = m.countryname, state = m.state, city = m.name
FROM geocoding_load.adminarea m
WHERE a.source = 'overture' AND a.level >= 3 AND m.level = 2 AND m.country = a.country
  AND ST_Contains(m.geom, ST_PointOnSurface(a.geom));

UPDATE geocoding_load.adminarea a
SET (countryname, state, city) = (SELECT m.countryname, m.state, m.name FROM geocoding_load.adminarea m
                                  WHERE m.level = 2 AND m.country = a.country ORDER BY m.geom <-> a.geom LIMIT 1)
WHERE a.source = 'overture' AND a.level >= 3 AND a.city IS NULL;

UPDATE geocoding_load.adminarea a
SET countryname = m.countryname, state = m.state, city = m.name
FROM (SELECT DISTINCT ON (o.source) o.source, m.id
      FROM geocoding_load.adminarea o
      JOIN geocoding_load.adminarea m ON m.level = 2 AND ST_Contains(m.geom, ST_PointOnSurface(o.geom))
      WHERE o.source IN ('medellin', 'bogota')
      GROUP BY o.source, m.id
      ORDER BY o.source, count(*) DESC) s
JOIN geocoding_load.adminarea m ON m.id = s.id
WHERE a.source = s.source;

DELETE FROM geocoding_load.adminarea a
WHERE a.source = 'overture' AND a.level = 5
  AND EXISTS (SELECT 1 FROM geocoding_load.adminarea o WHERE o.source IN ('medellin', 'bogota') AND o.city = a.city AND o.state = a.state);

INSERT INTO geocoding_load.adminarea (source, sourceid, country, level, name, countryname, state, city, geom)
SELECT 'bogota', 'upz:' || s.zone1, 'CO', 4, 'UPZ ' || geocoding_load.casing(initcap(s.zone1)), a.countryname, a.state, a.city,
       ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_UnaryUnion(ST_Collect(s.geom))), 3))
FROM geocoding_stage.adminarea s
JOIN geocoding_load.adminarea a ON a.source = s.source AND a.sourceid = s.sourceid
WHERE s.source = 'bogota' AND s.zone1 IS NOT NULL AND s.zone1 <> ''
GROUP BY s.zone1, a.countryname, a.state, a.city;

DELETE FROM geocoding_load.adminarea WHERE level = 6 AND ST_Area(geom::geography) > 200000;

UPDATE geocoding_load.adminarea SET countryname = name WHERE level = 0;
UPDATE geocoding_load.adminarea SET state = name WHERE level = 1;
UPDATE geocoding_load.adminarea SET city = name WHERE level = 2;

CREATE TABLE geocoding_load.adminareapart (
    areaid integer NOT NULL REFERENCES geocoding_load.adminarea (id) ON DELETE CASCADE,
    level smallint NOT NULL,
    geom geometry(Polygon, 4326) NOT NULL
);

INSERT INTO geocoding_load.adminareapart (areaid, level, geom)
SELECT id, level, ST_Subdivide(geom, 128) FROM geocoding_load.adminarea;

CREATE INDEX ON geocoding_load.adminareapart USING gist (geom);

CREATE TABLE geocoding_load.roadsegment (
    id serial PRIMARY KEY,
    sourceid character varying(60) NOT NULL,
    name character varying(200) NOT NULL,
    class character varying(30),
    geom geometry(LineString, 4326) NOT NULL
);

INSERT INTO geocoding_load.roadsegment (sourceid, name, class, geom)
SELECT s.sourceid, s.name, s.class, s.geom
FROM geocoding_stage.roadsegment s
WHERE EXISTS (SELECT 1 FROM geocoding_load.adminareapart p WHERE p.level = 0 AND p.geom && s.geom AND ST_Intersects(p.geom, s.geom));

CREATE INDEX ON geocoding_load.roadsegment USING gist (geom);

CREATE TABLE geocoding_load.place (
    id serial PRIMARY KEY,
    sourceid character varying(60) NOT NULL,
    name character varying(200) NOT NULL,
    category character varying(60),
    landmark boolean NOT NULL,
    geom geometry(Point, 4326) NOT NULL
);

INSERT INTO geocoding_load.place (sourceid, name, category, landmark, geom)
SELECT sourceid, name, category, coalesce(landmark, false), geom FROM geocoding_stage.place
WHERE name !~ '\(ort i |lat -?\d'
  AND (landmark OR (category IS NOT NULL AND category NOT LIKE '%service' AND category NOT LIKE '%clinic'
       AND category NOT IN ('health_care', 'specialized_health_care', 'surgery', 'corporate_or_business_office', 'attorney_or_law_firm',
                            'education', 'shopping', 'food_and_drink', 'arts_and_entertainment', 'community_and_government',
                            'travel_and_transportation', 'sports_and_recreation')));

CREATE INDEX ON geocoding_load.place USING gist (geom);

CREATE TABLE geocoding_load.settlement (
    id serial PRIMARY KEY,
    sourceid character varying(60) NOT NULL,
    kind character varying(20) NOT NULL,
    name character varying(200) NOT NULL,
    geom geometry(Point, 4326) NOT NULL
);

INSERT INTO geocoding_load.settlement (sourceid, kind, name, geom)
SELECT sourceid, kind, name, geom FROM geocoding_stage.settlement;

CREATE INDEX ON geocoding_load.settlement USING gist (geom);

ANALYZE geocoding_load.adminarea, geocoding_load.adminareapart, geocoding_load.roadsegment, geocoding_load.place, geocoding_load.settlement;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM geocoding_load.adminarea WHERE level = 2)
       OR NOT EXISTS (SELECT 1 FROM geocoding_load.roadsegment)
       OR NOT EXISTS (SELECT 1 FROM geocoding_load.place)
       OR NOT EXISTS (SELECT 1 FROM geocoding_load.settlement) THEN
        RAISE EXCEPTION 'The geocoding build produced an empty table; the current data was kept.';
    END IF;
END $$;

BEGIN;
DROP TABLE geocoding.adminareapart, geocoding.adminarea, geocoding.roadsegment, geocoding.place, geocoding.settlement;
ALTER TABLE geocoding_load.adminarea SET SCHEMA geocoding;
ALTER TABLE geocoding_load.adminareapart SET SCHEMA geocoding;
ALTER TABLE geocoding_load.roadsegment SET SCHEMA geocoding;
ALTER TABLE geocoding_load.place SET SCHEMA geocoding;
ALTER TABLE geocoding_load.settlement SET SCHEMA geocoding;
COMMIT;

DROP SCHEMA geocoding_load CASCADE;
DROP SCHEMA geocoding_stage CASCADE;
