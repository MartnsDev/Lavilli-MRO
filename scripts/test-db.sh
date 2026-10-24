#!/usr/bin/env bash
set -euo pipefail
# Uses PGHOST/PGPORT/PGUSER/PGPASSWORD. Never run against a production cluster.
if [[ "${RUN_DATABASE_TESTS:-}" != "1" ]]; then
  echo 'Set RUN_DATABASE_TESTS=1 and PGHOST/PGPORT for an isolated test cluster.' >&2; exit 1
fi
export PGDATABASE="lavilli_test_${$}_${RANDOM}"
[[ "$PGDATABASE" =~ ^lavilli_test_[0-9]+_[0-9]+$ ]] || exit 1
createdb "$PGDATABASE"
restore_database="${PGDATABASE}_restore"
backup_file="$(mktemp /tmp/lavilli-db-test.XXXXXX)"
trap 'dropdb --if-exists "$restore_database"; dropdb --if-exists "$PGDATABASE"; rm -f "$backup_file"' EXIT
psql -X -q -v ON_ERROR_STOP=1 -c "do \$\$begin if not exists(select from pg_roles where rolname='anon') then create role anon; end if; if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if; if not exists(select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if; end\$\$;"
# A Storage catalog stub validates bucket SQL only; it does not emulate Supabase Storage/RLS.
psql -X -q -v ON_ERROR_STOP=1 -c 'create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);'
for migration in supabase/migrations/*.sql; do psql -X -q -v ON_ERROR_STOP=1 -f "$migration"; done
psql -X -q -v ON_ERROR_STOP=1 -f supabase/tests/domain.sql >/dev/null
psql -X -q -v ON_ERROR_STOP=1 -f supabase/tests/security.sql >/dev/null
# Two independent sessions race on the same tool and stock lot.
worker() { psql -X -q -v ON_ERROR_STOP=1 -c "$1" >/dev/null 2>&1; }
set +e
worker "select tests.call(jsonb_build_object('action','tool_checkout','data',jsonb_build_object('tool_id',tests.id('race_tool'),'destination','Oficina'),'reason','Corrida ferramenta A'));" & a=$!
worker "select tests.call(jsonb_build_object('action','tool_checkout','data',jsonb_build_object('tool_id',tests.id('race_tool'),'destination','Oficina'),'reason','Corrida ferramenta B'));" & b=$!
wait "$a"; ra=$?; wait "$b"; rb=$?
if [[ $((ra+rb)) -eq 0 || ( "$ra" != 0 && "$rb" != 0 ) ]]; then echo 'Tool race failed'; exit 1; fi
worker "select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('race_lot'),'kind','consume','quantity',8),'reason','Corrida estoque A'));" & a=$!
worker "select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('race_lot'),'kind','consume','quantity',8),'reason','Corrida estoque B'));" & b=$!
wait "$a"; ra=$?; wait "$b"; rb=$?
if [[ $((ra+rb)) -eq 0 || ( "$ra" != 0 && "$rb" != 0 ) ]]; then echo 'Stock race failed'; exit 1; fi
set -e
psql -X -q -v ON_ERROR_STOP=1 -c "select tests.assert((select count(*)=1 from public.tool_checkouts where tool_id=tests.id('race_tool') and returned_at is null),'one concurrent checkout');select tests.assert((select quantity=2 from public.stock_lots where id=tests.id('race_lot')),'nonnegative concurrent stock');"
# Same operation key racing must apply once.
worker "select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('race_lot'),'kind','receive','quantity',1),'reason','Idempotência concorrente'),'00000000-0000-4000-8000-000000000099');" & a=$!
worker "select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('race_lot'),'kind','receive','quantity',1),'reason','Idempotência concorrente'),'00000000-0000-4000-8000-000000000099');" & b=$!
wait "$a"; wait "$b"
psql -X -q -v ON_ERROR_STOP=1 -c "select tests.assert((select quantity=3 from public.stock_lots where id=tests.id('race_lot')),'concurrent retry applies once');"
pg_dump --format=custom --no-owner --schema=public --schema=private_security --file="$backup_file"
createdb "$restore_database"
PGDATABASE="$restore_database" psql -X -q -v ON_ERROR_STOP=1 -c "drop schema public;"
PGDATABASE="$restore_database" pg_restore --dbname="$restore_database" --no-owner --exit-on-error "$backup_file"
PGDATABASE="$restore_database" psql -X -q -v ON_ERROR_STOP=1 -c "do \$\$begin if not exists(select 1 from public.stock_lots where quantity=3) then raise exception 'Restore validation failed';end if;if has_function_privilege('anon','public.run_operation(uuid,uuid,uuid,text,jsonb)','EXECUTE') then raise exception 'Restore grants validation failed';end if;end\$\$;"
echo 'PASS: migrations, permissions, business rules, rollback, 3 concurrent races and database dump/restore.'
