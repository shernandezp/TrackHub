#!/bin/bash
# import-geocoding.sh            download and load the reference data only when the geocoding tables are empty
# import-geocoding.sh --refresh  rebuild from the latest sources; lookups use the old data until the swap
# Sources: Overture Maps (GEOCODING_OVERTURE_RELEASE, default latest), Geofabrik OSM, Medellín and Bogotá barrio layers.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ $1${NC}"; }

refresh=false
[ "$1" = "--refresh" ] && refresh=true

sql_dir=$(dirname "$0")/sql
connection_string=${DB_CONNECTION_MANAGER:?DB_CONNECTION_MANAGER is not set}

export PGHOST=$(echo "$connection_string" | grep -oP 'server=\K[^;]+')
PGPORT=$(echo "$connection_string" | grep -oP 'port=\K[^;]+'); export PGPORT=${PGPORT:-5432}
export PGUSER=$(echo "$connection_string" | grep -oP 'user id=\K[^;]+')
export PGDATABASE=$(echo "$connection_string" | grep -oP 'database=\K[^;]+')
export PGPASSWORD=$(echo "$connection_string" | grep -oP 'password=\K[^;]+')
export PGCLIENTENCODING=UTF8
export PGOPTIONS='-c client_min_messages=warning'

run_psql() { psql -q -v ON_ERROR_STOP=1 "$@"; }

run_psql -f "$sql_dir/geocoding-schema.sql"
print_success "Geocoding schema installed in $PGDATABASE."

if ! $refresh && [ "$(run_psql -tAc 'SELECT EXISTS (SELECT 1 FROM geocoding.adminarea)')" = "t" ]; then
    print_info "Geocoding data already loaded; skipping the import (use --refresh to reload)."
    exit 0
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

release=${GEOCODING_OVERTURE_RELEASE:-$(curl -fsSL https://stac.overturemaps.org/catalog.json | grep -oP '"latest":"\K[^"]+')}
: "${release:?Could not determine the latest Overture release}"
print_info "Building the geocoding data from Overture release $release (about 30 minutes)..."

download_layer() {
    local name=$1 url=$2 fields=$3 offset=0 page
    while :; do
        page="$work/$name-$offset.geojson"
        curl -fsSL -o "$page" "$url/query?where=1%3D1&outFields=$fields&returnGeometry=true&outSR=4326&resultOffset=$offset&resultRecordCount=2000&f=geojson"
        grep -q '"exceededTransferLimit":true' "$page" || break
        offset=$((offset + 2000))
    done
}
layer_sql() {
    local first=true f
    for f in "$work/$1"-*.geojson; do
        $first || echo "UNION ALL"
        echo "SELECT * FROM ST_Read('$f')"
        first=false
    done
}

download_layer medellin 'https://services.arcgis.com/mBg08vgayOnqC7Si/arcgis/rest/services/Observatorio_Inmobiliario_de_Medell%C3%ADn_WFL1/FeatureServer/2' NOMBRE_BAR
download_layer bogota 'https://services8.arcgis.com/oq61XNrfVSFKTvTy/arcgis/rest/services/BARRIOS_Bogot%C3%A1/FeatureServer/0' 'BARRIO,UPZ'

curl -fsSL -o "$work/colombia.osm.pbf" https://download.geofabrik.de/south-america/colombia-latest.osm.pbf
ogr2ogr -f FlatGeobuf "$work/osm-adm-co.fgb" "$work/colombia.osm.pbf" multipolygons \
    -where "boundary='administrative' AND admin_level IN ('4','6')" -select name,admin_level,other_tags

run_psql -c "DROP SCHEMA IF EXISTS geocoding_stage CASCADE; CREATE SCHEMA geocoding_stage;"

duckdb -batch -bail "$work/build.duckdb" <<EOF
SET temp_directory='$work/duckdb';
SET threads=16;
SET memory_limit='${GEOCODING_MEMORY_LIMIT:-2GB}';
SET preserve_insertion_order=false;
SET enable_progress_bar=false;
INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial; INSTALL postgres; LOAD postgres;
SET s3_region='us-west-2';
ATTACH '' AS pg (TYPE postgres);
CREATE TABLE area AS
SELECT id, division_id, subtype, country, names.primary AS name, geometry
FROM read_parquet('s3://overturemaps-us-west-2/release/$release/theme=divisions/type=division_area/*', hive_partitioning=1)
WHERE country IN ('CO','CR') AND class = 'land'
  AND subtype IN ('country','region','county','locality','macrohood','neighborhood','microhood');
CREATE TABLE division AS
SELECT id, hierarchies[1] AS chain
FROM read_parquet('s3://overturemaps-us-west-2/release/$release/theme=divisions/type=division/*', hive_partitioning=1)
WHERE country IN ('CO','CR');
CREATE TABLE osmadmin AS
SELECT name, admin_level, other_tags, geom FROM ST_Read('$work/osm-adm-co.fgb');
CREATE TABLE osmstate AS
SELECT name, geom FROM osmadmin WHERE admin_level = '4' AND other_tags LIKE '%"ISO3166-2"=>"CO-%';
CREATE TABLE medellin AS $(layer_sql medellin);
CREATE TABLE bogota AS $(layer_sql bogota);
CREATE TABLE stage_adminarea AS
SELECT source, sourceid, country, zone1, level, name, countryname, state, city, ST_AsWKB(geom)::BLOB AS geom FROM (
SELECT 'overture' AS source, a.id AS sourceid, a.country,
       NULL::VARCHAR AS zone1,
       CASE a.subtype WHEN 'country' THEN 0 WHEN 'region' THEN 1 WHEN 'county' THEN 2 WHEN 'locality' THEN 3 WHEN 'macrohood' THEN 4 WHEN 'neighborhood' THEN 5 ELSE 6 END AS level,
       a.name,
       list_extract(list_filter(d.chain, lambda x: x.subtype = 'country'), 1).name AS countryname,
       list_extract(list_filter(d.chain, lambda x: x.subtype = 'region'), 1).name AS state,
       list_extract(list_filter(d.chain, lambda x: x.subtype = 'county'), 1).name AS city,
       ST_GeomFromWKB(ST_AsWKB(a.geometry)) AS geom
FROM area a LEFT JOIN division d ON d.id = a.division_id
WHERE NOT (a.country = 'CO' AND a.subtype IN ('region','county'))
UNION ALL
SELECT 'osm', 'osm:' || CAST(row_number() OVER () AS VARCHAR), 'CO', NULL, 1, name, 'Colombia', name, NULL, geom
FROM osmstate
UNION ALL
SELECT 'osm', 'osm:m' || CAST(row_number() OVER () AS VARCHAR), 'CO', NULL, 2,
       CASE m.name WHEN 'Bogotá Distrito Capital - Municipio' THEN 'Bogotá' ELSE m.name END, 'Colombia', s.name, NULL, m.geom
FROM osmadmin m
JOIN osmstate s ON ST_Contains(s.geom, ST_PointOnSurface(m.geom))
WHERE m.admin_level = '6' AND m.name IS NOT NULL
UNION ALL
SELECT 'overture', a.id, 'CO', NULL, 2, a.name, 'Colombia', s.name, NULL, ST_GeomFromWKB(ST_AsWKB(a.geometry))
FROM area a
JOIN osmstate s ON ST_Contains(s.geom, ST_PointOnSurface(ST_GeomFromWKB(ST_AsWKB(a.geometry))))
WHERE a.country = 'CO' AND a.subtype = 'county'
  AND NOT EXISTS (SELECT 1 FROM osmadmin m WHERE m.admin_level = '6'
                  AND ST_Contains(m.geom, ST_PointOnSurface(ST_GeomFromWKB(ST_AsWKB(a.geometry)))))
UNION ALL
SELECT 'medellin', 'medellin:' || CAST(row_number() OVER () AS VARCHAR), 'CO', NULL, 5, NOMBRE_BAR, NULL, NULL, NULL, ST_GeomFromWKB(ST_AsWKB(geom))
FROM medellin
UNION ALL
SELECT 'bogota', 'bogota:' || CAST(row_number() OVER () AS VARCHAR), 'CO', UPZ, 5, BARRIO, NULL, NULL, NULL, ST_GeomFromWKB(ST_AsWKB(geom))
FROM bogota);
CREATE TABLE stage_roadsegment AS
SELECT id AS sourceid, coalesce(names.primary, routes[1].ref) AS name, class, ST_AsWKB(ST_GeomFromWKB(ST_AsWKB(geometry)))::BLOB AS geom
FROM read_parquet('s3://overturemaps-us-west-2/release/$release/theme=transportation/type=segment/*', hive_partitioning=1)
WHERE subtype = 'road' AND coalesce(names.primary, routes[1].ref) IS NOT NULL
  AND class NOT IN ('footway','steps','path','bridleway','cycleway')
  AND ((bbox.xmin > -79.1 AND bbox.xmax < -66.8 AND bbox.ymin > -4.3 AND bbox.ymax < 13.5)
    OR (bbox.xmin > -86 AND bbox.xmax < -82.5 AND bbox.ymin > 8 AND bbox.ymax < 11.3));
CREATE TABLE stage_place AS
SELECT id AS sourceid, names.primary AS name, basic_category AS category,
       coalesce(basic_category IN ('hospital','emergency_department','emergency_or_urgent_care_facility','outpatient_care_facility',
    'police_station','fire_station','courthouse','government_office','government_department','embassy','jail_or_prison',
    'place_of_learning','preschool','elementary_school','middle_school','high_school','college_university','campus_building',
    'library','museum','cultural_center','community_center','christian_place_of_worship','cemetery',
    'park','national_park','nature_reserve','public_plaza','stadium_arena','sport_field','monument','historic_site',
    'amusement_park','zoo','fairgrounds','event_venue',
    'shopping_mall','department_store','superstore','warehouse_club_store','farmers_market','bank_or_credit_union',
    'gas_station','fueling_station','airport','train_station','public_transit_facility_or_service','parking','bridge','pier','marina',
    'manufacturer','industrial_facility_or_service','storage_facility','supplier_or_distributor','wholesaler',
    'b2b_transportation_and_storage_service','public_utility','water_utility_provider','electric_utility_provider',
    'military_site','military_base','farm','senior_living_facility'), false) AS landmark,
       ST_AsWKB(ST_GeomFromWKB(ST_AsWKB(geometry)))::BLOB AS geom
FROM read_parquet('s3://overturemaps-us-west-2/release/$release/theme=places/type=place/*', hive_partitioning=1)
WHERE addresses[1].country IN ('CO','CR') AND names.primary IS NOT NULL AND length(names.primary) <= 60 AND confidence >= 0.7
  AND coalesce(operating_status, 'open') = 'open';
CREATE TABLE stage_settlement AS
SELECT id AS sourceid, subtype AS kind, names.primary AS name, ST_AsWKB(ST_GeomFromWKB(ST_AsWKB(geometry)))::BLOB AS geom
FROM read_parquet('s3://overturemaps-us-west-2/release/$release/theme=divisions/type=division/*', hive_partitioning=1)
WHERE country IN ('CO','CR') AND subtype IN ('locality','neighborhood','macrohood','microhood') AND names.primary IS NOT NULL;
CREATE TABLE pg.geocoding_stage.adminarea AS SELECT * FROM stage_adminarea;
CREATE TABLE pg.geocoding_stage.roadsegment AS SELECT * FROM stage_roadsegment;
CREATE TABLE pg.geocoding_stage.place AS SELECT * FROM stage_place;
CREATE TABLE pg.geocoding_stage.settlement AS SELECT * FROM stage_settlement;
EOF

print_info "Building and swapping in the geocoding tables..."
run_psql -f "$sql_dir/geocoding-load.sql"
run_psql -c "SELECT level, count(*) FROM geocoding.adminarea GROUP BY 1 ORDER BY 1"
print_success "Geocoding data imported (Overture $release)."
