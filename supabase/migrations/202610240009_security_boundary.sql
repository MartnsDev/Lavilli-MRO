-- Additive security boundary. Keeps all existing rows, migrations and business tables.
create schema if not exists private_security;
revoke all on schema private_security from public,anon,authenticated;
grant usage on schema private_security to service_role;
create table private_security.device_grants(id uuid primary key default gen_random_uuid(),token_hash text not null unique,purpose text not null check(purpose in ('enroll','admin')),expires_at timestamptz not null,used_at timestamptz,created_at timestamptz not null default now());
create table private_security.rate_buckets(key text primary key,attempts int not null,window_start timestamptz not null);
create table private_security.job_leases(name text primary key,until_at timestamptz not null);
alter table public.authorized_devices add column last_seen_at timestamptz;
-- Legacy auto-enrollment never proves independent device authorization. Preserve rows but require a new grant.
alter table public.authorized_devices add column authorization_version int not null default 0 check(authorization_version in (0,1));
alter table public.access_sessions add column last_seen_at timestamptz not null default now();
alter table public.access_sessions add column credential_version text;
alter table public.access_sessions add column elevated_until timestamptz;
alter table public.audit_events add column session_id uuid references public.access_sessions;
alter table public.audit_events add column device_id uuid references public.authorized_devices;
alter table public.audit_events add column responsavel_declarado text;
alter table public.audit_events add column outcome text not null default 'success';
alter table public.audit_events add column request_id uuid not null default gen_random_uuid();
alter table public.document_versions add column scan_status text not null default 'pending' check(scan_status in ('pending','clean','rejected'));
alter table public.document_versions add column scanned_at timestamptz;
create table private_security.import_sources(id uuid primary key default gen_random_uuid(),session_id uuid not null references public.access_sessions,object_path text not null unique,sha256 text not null,name text not null,size_bytes int not null check(size_bytes between 1 and 2097152),created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '1 hour',job_id uuid references public.import_jobs);
create function public.security_event(p_kind text,p_session uuid default null,p_entity text default 'security',p_entity_id uuid default null,p_outcome text default 'denied',p_request uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare s public.access_sessions;begin
 if p_kind !~ '^[a-z_]{1,60}$' or p_outcome not in ('success','denied','failed','pending') then raise exception 'INVALID_OPERATION';end if;
 select * into s from public.access_sessions where id=p_session;
 insert into public.audit_events(entity,entity_id,action,mechanic_id,session_id,device_id,responsavel_declarado,outcome,request_id)
 values(left(p_entity,60),p_entity_id,p_kind,s.mechanic_id,s.id,s.device_id,(select name from public.mechanics where id=s.mechanic_id),p_outcome,coalesce(p_request,gen_random_uuid()));
end $$;
create function public.issue_device_grant(p_hash text,p_purpose text) returns uuid language plpgsql security definer set search_path='' as $$declare i uuid;begin
 if p_hash !~ '^[a-f0-9]{64}$' or p_purpose not in ('enroll','admin') then raise exception 'INVALID_OPERATION';end if;
 insert into private_security.device_grants(token_hash,purpose,expires_at) values(p_hash,p_purpose,now()+interval '15 minutes') returning id into i;
 perform public.security_event('grant_issued',null,'device_grants',i,'success');return i;
end $$;
create function public.authorize_device(p_grant text,p_token text) returns uuid language plpgsql security definer set search_path='' as $$declare i uuid;begin
 update private_security.device_grants set used_at=now() where token_hash=p_grant and purpose='enroll' and used_at is null and expires_at>now();
 if not found or p_token !~ '^[a-f0-9]{64}$' then raise exception 'FORBIDDEN';end if;
 insert into public.authorized_devices(token_hash,label,expires_at,last_seen_at,authorization_version) values(p_token,'Aparelho autorizado',now()+interval '90 days',now(),1) returning id into i;
 perform public.security_event('device_authorized',null,'authorized_devices',i,'success');return i;
end $$;
create function public.check_device(p_hash text) returns uuid language sql security definer set search_path='' as $$select id from public.authorized_devices where token_hash=p_hash and authorization_version=1 and revoked_at is null and expires_at>now()$$;
create function public.validate_session(p_hash text,p_device text,p_version text) returns table(id uuid,mechanic_id uuid,device_id uuid,elevated_until timestamptz) language plpgsql security definer set search_path='' as $$declare s public.access_sessions;begin
 select a.* into s from public.access_sessions a join public.authorized_devices d on d.id=a.device_id
 where a.token_hash=p_hash and a.credential_version=p_version and a.revoked_at is null and a.expires_at>now() and a.last_seen_at>now()-interval '30 minutes' and d.token_hash=p_device and d.authorization_version=1 and d.revoked_at is null and d.expires_at>now() for update of a;
 if not found then raise exception 'UNAUTHORIZED';end if;
 update public.access_sessions a set last_seen_at=now() where a.id=s.id;
 update public.authorized_devices d set last_seen_at=now() where d.id=s.device_id;
 return query select s.id,s.mechanic_id,s.device_id,s.elevated_until;
end $$;
create function public.elevate_session(p_session uuid,p_grant text) returns void language plpgsql security definer set search_path='' as $$begin
 perform 1 from public.access_sessions where id=p_session and revoked_at is null and expires_at>now() and last_seen_at>now()-interval '30 minutes';if not found then raise exception 'UNAUTHORIZED';end if;
 update private_security.device_grants set used_at=now() where token_hash=p_grant and purpose='admin' and used_at is null and expires_at>now();if not found then raise exception 'FORBIDDEN';end if;
 update public.access_sessions set elevated_until=now()+interval '5 minutes' where id=p_session;
 perform public.security_event('reauthenticated',p_session,'security',null,'success');
end $$;
create function public.manage_access(p_session uuid,p_action text,p_device uuid default null) returns void language plpgsql security definer set search_path='' as $$begin
 if not exists(select 1 from public.access_sessions s join public.authorized_devices d on d.id=s.device_id where s.id=p_session and s.revoked_at is null and s.expires_at>now() and s.last_seen_at>now()-interval '30 minutes' and s.elevated_until>now() and d.authorization_version=1 and d.revoked_at is null and d.expires_at>now()) then raise exception 'FORBIDDEN';end if;
 if p_action='revoke_device' then
 update public.authorized_devices set revoked_at=now() where id=p_device; if not found then raise exception 'NOT_FOUND';end if;
 update public.access_sessions set revoked_at=now() where device_id=p_device;
 elsif p_action='revoke_sessions' then update public.access_sessions set revoked_at=now() where revoked_at is null;
 else raise exception 'INVALID_OPERATION';end if;
 perform public.security_event(p_action,p_session,'authorized_devices',p_device,'success');
end $$;
create function public.security_limit(p_keys text[],p_limits int[],p_window int default 900) returns jsonb language plpgsql security definer set search_path='' as $$declare k text;n int;i int:=0;ok boolean:=true;largest int:=0;new_denial boolean:=false;begin
 if cardinality(p_keys)<>cardinality(p_limits) or cardinality(p_keys)>4 or p_window not between 1 and 900 then raise exception 'INVALID_OPERATION';end if;
 for i in 1..cardinality(p_keys) loop
 k:=p_keys[i];if k !~ '^[a-f0-9]{64}$' or p_limits[i] not between 1 and 20000 then raise exception 'INVALID_OPERATION';end if;
 insert into private_security.rate_buckets as b values(k,1,now()) on conflict(key) do update set attempts=case when b.window_start<now()-make_interval(secs=>p_window) then 1 else least(b.attempts+1,20001) end,window_start=case when b.window_start<now()-make_interval(secs=>p_window) then now() else b.window_start end returning attempts into n;
 if n>p_limits[i] then ok:=false;end if;if n=p_limits[i]+1 then new_denial:=true;end if;largest:=n;
 end loop;
 if new_denial then perform public.security_event('rate_limited');end if;
 return jsonb_build_object('allowed',ok,'delay_ms',least(600,greatest(0,largest-2)*50),'retry_after',p_window);
end $$;
create function public.clear_security_limit(p_key text) returns void language sql security definer set search_path='' as $$delete from private_security.rate_buckets where key=p_key$$;
create function public.record_document_scan(p_version uuid,p_sha text,p_clean boolean) returns void language plpgsql security definer set search_path='' as $$begin
 perform set_config('app.scanner','true',true);
 update public.document_versions set scan_status=case when p_clean then 'clean' else 'rejected' end,scanned_at=now() where id=p_version and sha256=p_sha;if not found then raise exception 'NOT_FOUND';end if;
 perform public.security_event('document_scanned',null,'document_versions',p_version,case when p_clean then 'success' else 'denied' end);
end $$;
create function public.register_import_source(p_session uuid,p_path text,p_hash text,p_name text,p_size int) returns uuid language plpgsql security definer set search_path='' as $$declare i uuid;begin
 if p_path !~ '^imports/[a-f0-9-]{36}/[A-Za-z0-9_-]{43}$' or p_hash !~ '^[a-f0-9]{64}$' or length(p_name)>200 then raise exception 'INVALID_OPERATION';end if;
 insert into private_security.import_sources(session_id,object_path,sha256,name,size_bytes) values(p_session,p_path,p_hash,p_name,p_size) returning id into i;return i;
end $$;
create function public.claim_job() returns boolean language plpgsql security definer set search_path='' as $$declare won boolean;begin
 insert into private_security.job_leases values('alerts',now()+interval '60 seconds') on conflict(name) do update set until_at=excluded.until_at where private_security.job_leases.until_at<now() returning true into won;return coalesce(won,false);
end $$;
-- Preserve original function body for data/behavior compatibility, but remove its API access.
alter function public.run_operation(uuid,uuid,uuid,text,jsonb) rename to run_operation_legacy;
revoke all on function public.run_operation_legacy(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated,service_role;
create function public.run_operation(p_session uuid,p_confirmation uuid,p_operation uuid,p_hash text,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$declare s public.access_sessions;r jsonb;source uuid;begin
 select a.* into s from public.access_sessions a join public.authorized_devices d on d.id=a.device_id where a.id=p_session and a.revoked_at is null and a.expires_at>now() and a.last_seen_at>now()-interval '30 minutes' and a.credential_version is not null and d.authorization_version=1 and d.revoked_at is null and d.expires_at>now() for share of a,d;
 if not found then raise exception 'UNAUTHORIZED';end if;
 if p_command->>'entity' in ('mechanics','notification_recipients','notification_rules','app_settings') and (s.elevated_until is null or s.elevated_until<=now()) then raise exception 'FORBIDDEN';end if;
 perform set_config('app.session_id',s.id::text,true);
 perform set_config('app.actor_label',coalesce((select m.name from public.confirmations c join public.mechanics m on m.id=c.mechanic_id where c.id=p_confirmation),''),true);
 if p_command->>'action'='import_rows' then
 source:=(p_command->'data'->>'source_id')::uuid;
 perform 1 from private_security.import_sources where id=source and session_id=s.id and expires_at>now() for update;if not found then raise exception 'FORBIDDEN';end if;
 if exists(select 1 from private_security.import_sources where id=source and job_id is not null) and not exists(select 1 from public.operation_results where id=p_operation and session_id=s.id and operation_hash=p_hash) then raise exception 'FORBIDDEN';end if;
 end if;
 r:=public.run_operation_legacy(p_session,p_confirmation,p_operation,p_hash,p_command);
 if source is not null then update private_security.import_sources set job_id=(r->>'id')::uuid where id=source;end if;
 return r;
end $$;
create or replace function public.audit_change() returns trigger language plpgsql security definer set search_path='' as $$declare actor uuid;op uuid;s public.access_sessions;begin
 if TG_TABLE_NAME='document_versions' and current_setting('app.scanner',true)='true' then return NEW;end if;
 actor:=nullif(current_setting('app.mechanic_id',true),'')::uuid;op:=nullif(current_setting('app.operation_id',true),'')::uuid;
 if actor is null or op is null then raise exception 'FORBIDDEN';end if;
 select * into s from public.access_sessions where id=nullif(current_setting('app.session_id',true),'')::uuid;
 insert into public.audit_events(entity,entity_id,action,before_data,after_data,mechanic_id,operation_id,reason,session_id,device_id,responsavel_declarado)
 values(TG_TABLE_NAME,coalesce(NEW.id,OLD.id),TG_OP,case when TG_OP='INSERT' then null else to_jsonb(OLD) end,case when TG_OP='DELETE' then null else to_jsonb(NEW) end,actor,op,current_setting('app.reason',true),s.id,s.device_id,coalesce(nullif(current_setting('app.actor_label',true),''),(select name from public.mechanics where id=actor)));return coalesce(NEW,OLD);
end $$;
-- Scan metadata updates require their own immutable security event, not business actor spoofing.
create function public.document_scan_guard() returns trigger language plpgsql set search_path='' as $$begin
 if NEW.scan_status is distinct from OLD.scan_status or NEW.scanned_at is distinct from OLD.scanned_at then
 if NEW.sha256<>OLD.sha256 or NEW.object_path<>OLD.object_path then raise exception 'FORBIDDEN';end if;
 end if;return NEW;end $$;
create trigger guard_document_scan before update on public.document_versions for each row execute function public.document_scan_guard();
-- Existing document_versions audit trigger requires business actor context for scanner updates.
create trigger audit_no_truncate before truncate on public.audit_events for each statement execute function public.no_audit_rewrite();
revoke insert,update,delete,truncate on public.audit_events from service_role;
revoke execute on function public.enroll_device(text,uuid,text,text,text,text),public.take_attempt(text,int),public.reset_attempt(text) from service_role;
do $$declare r record;begin
 for r in select tablename from pg_tables where schemaname in ('public','private_security') loop
 if exists(select 1 from pg_tables where schemaname='public' and tablename=r.tablename) then
 execute format('alter table public.%I enable row level security',r.tablename);end if;
 end loop;
 for r in select tablename from pg_tables where schemaname='private_security' loop execute format('alter table private_security.%I enable row level security',r.tablename);end loop;
end$$;
revoke all on all tables in schema public from public,anon,authenticated;
revoke all on all sequences in schema public from public,anon,authenticated;
revoke execute on all functions in schema public from public,anon,authenticated;
revoke all on schema public from public,anon,authenticated;
grant usage on schema public to service_role;
alter default privileges in schema public revoke all on tables from public,anon,authenticated;
alter default privileges in schema public revoke all on sequences from public,anon,authenticated;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated;
alter default privileges in schema private_security revoke all on tables from public,anon,authenticated;
alter default privileges in schema private_security revoke execute on functions from public,anon,authenticated;
grant execute on function public.security_event(text,uuid,text,uuid,text,uuid),public.issue_device_grant(text,text),public.authorize_device(text,text),public.check_device(text),public.validate_session(text,text,text),public.elevate_session(uuid,text),public.manage_access(uuid,text,uuid),public.security_limit(text[],int[],int),public.clear_security_limit(text),public.record_document_scan(uuid,text,boolean),public.register_import_source(uuid,text,text,text,int),public.claim_job(),public.run_operation(uuid,uuid,uuid,text,jsonb) to service_role;
notify pgrst,'reload schema';
create table private_security.upload_budget(day date not null,device_id uuid not null references public.authorized_devices,bytes bigint not null,count int not null,primary key(day,device_id));
alter table private_security.upload_budget enable row level security;
create function public.reserve_upload(p_session uuid,p_size int) returns void language plpgsql security definer set search_path='' as $$declare d uuid;b bigint;c int;begin
 if p_size not between 1 and 4194304 then raise exception 'INVALID_OPERATION';end if;
 select device_id into d from public.access_sessions where id=p_session and revoked_at is null and expires_at>now();if d is null then raise exception 'UNAUTHORIZED';end if;
 insert into private_security.upload_budget as u values((now() at time zone 'UTC')::date,d,p_size,1) on conflict(day,device_id) do update set bytes=u.bytes+excluded.bytes,count=u.count+1 returning bytes,count into b,c;
 if b>104857600 or c>50 then raise exception 'RATE_LIMIT';end if;
end $$;
revoke all on function public.reserve_upload(uuid,int) from public,anon,authenticated;
grant execute on function public.reserve_upload(uuid,int) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('import-originals','import-originals',false,2097152,array['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']) on conflict(id) do nothing;
notify pgrst,'reload schema';
-- A return is custody, not availability. Explicit condition recording is needed afterwards.
do $$declare body text;begin
 select pg_get_functiondef('public.run_operation_legacy(uuid,uuid,uuid,text,jsonb)'::regprocedure) into body;
 body:=replace(body,'state:=data->>''condition'';dest:=','state:=data->>''condition'';if state=''available'' then state:=''quarantine'';end if;dest:=');
 body:=replace(body,'if state<>''available'' then insert into public.tool_discrepancies','if state not in (''available'',''quarantine'') then insert into public.tool_discrepancies');
 body:=replace(body,'state:=case when tool.id=any(seen) then ''available'' else ''missing'' end','state:=case when tool.id=any(seen) then ''quarantine'' else ''missing'' end');
 execute body;
end$$;
revoke all on function public.run_operation_legacy(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated,service_role;
