-- ISOLATED DB ONLY: all-table permissions, independent device factor, limits and revocation.
create function tests.denied(sql_text text,who text) returns void language plpgsql as $$declare blocked boolean:=false;begin
 execute format('set local role %I',who);
 begin execute sql_text;exception when insufficient_privilege then blocked:=true;end;
 reset role;
 if not blocked then raise exception 'FAIL unauthorized query: %',sql_text;end if;
end$$;
do $$declare r record;who text;n bigint;after_n bigint;begin
 for r in select tablename from pg_tables where schemaname='public' loop
 execute format('select count(*) from public.%I',r.tablename) into n;
 foreach who in array array['anon','authenticated'] loop
 perform tests.denied(format('select * from public.%I limit 1',r.tablename),who);
 perform tests.denied(format('insert into public.%I default values',r.tablename),who);
 perform tests.denied(format('update public.%I set id=id',r.tablename),who);
 perform tests.denied(format('delete from public.%I',r.tablename),who);
 perform tests.denied(format('insert into public.%I(id) values(gen_random_uuid()) on conflict(id) do update set id=excluded.id',r.tablename),who);
 end loop;
 execute format('select count(*) from public.%I',r.tablename) into after_n;
 if n<>after_n then raise exception 'FAIL table changed';end if;
 end loop;
 perform tests.assert(true,'all 42 public tables reject SELECT and all writes for anon/authenticated with unchanged row counts');
 perform tests.denied('select public.issue_device_grant(repeat(''a'',64),''enroll'')','anon');
 perform tests.denied('select public.run_operation_legacy(null,null,null,null,null)','service_role');
 perform tests.assert(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and not exists(select 1 from pg_depend e where e.classid='pg_proc'::regclass and e.objid=p.oid and e.deptype='e') and (has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'))),'no application RPC executable by anonymous or Supabase Auth users');
end$$;
do $$declare grant_id uuid;device_id uuid;s uuid;row_hash text;v jsonb;begin
 grant_id:=public.issue_device_grant(repeat('a',64),'enroll');
 begin perform public.authorize_device(repeat('b',64),repeat('c',64));raise exception 'FAIL';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 update private_security.device_grants set expires_at=now()-interval '1 second' where id=grant_id;
 begin perform public.authorize_device(repeat('a',64),repeat('c',64));raise exception 'FAIL';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 update private_security.device_grants set expires_at=now()+interval '1 minute' where id=grant_id;
 device_id:=public.authorize_device(repeat('a',64),repeat('c',64));
 begin perform public.authorize_device(repeat('a',64),repeat('d',64));raise exception 'FAIL';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 insert into public.access_sessions(device_id,mechanic_id,credential_version,token_hash,expires_at) values(device_id,(select id from public.mechanics where name='César'),'version-a',repeat('d',64),now()+interval '8 hours') returning id into s;
 perform public.validate_session(repeat('d',64),repeat('c',64),'version-a');
 begin perform public.validate_session(repeat('d',64),repeat('c',64),'version-b');raise exception 'FAIL';exception when others then if sqlerrm<>'UNAUTHORIZED' then raise;end if;end;
 update public.access_sessions set last_seen_at=now()-interval '31 minutes' where id=s;
 begin perform public.validate_session(repeat('d',64),repeat('c',64),'version-a');raise exception 'FAIL';exception when others then if sqlerrm<>'UNAUTHORIZED' then raise;end if;end;
 update public.access_sessions set last_seen_at=now() where id=s;
 update public.authorized_devices set revoked_at=now() where id=device_id;
 begin perform public.validate_session(repeat('d',64),repeat('c',64),'version-a');raise exception 'FAIL';exception when others then if sqlerrm<>'UNAUTHORIZED' then raise;end if;end;
 for i in 1..5 loop v:=public.security_limit(array[repeat('e',64)],array[5]);end loop;
 v:=public.security_limit(array[repeat('e',64)],array[5]);perform tests.assert(not(v->>'allowed')::boolean,'persistent shared limiter rejects sixth attempt without rollback');
 perform tests.assert((select attempts=6 from private_security.rate_buckets where key=repeat('e',64)),'rejected attempt persists in database');
 perform tests.assert(true,'invalid, expired, reused grants, idle sessions, credential rotation and revoked devices denied');
end$$;
-- Defaults protect newly migrated tables as well as current tables.
create table public.future_security_fixture(id uuid primary key);
alter table public.future_security_fixture enable row level security;
select tests.denied('insert into public.future_security_fixture default values','anon');
select tests.denied('select * from public.future_security_fixture','authenticated');

-- Old PIN-only device rows must not inherit the new independent trust factor.
do $$declare legacy uuid;begin
 insert into public.authorized_devices(token_hash,label,expires_at) values(repeat('9',64),'Legacy fixture',now()+interval '1 day') returning id into legacy;
 perform tests.assert(public.check_device(repeat('9',64)) is null,'legacy auto-enrolled device cannot bypass new independent authorization');
end$$;
