create function public.enroll_device(p_bootstrap text,p_challenge uuid,p_code text,p_browser text,p_token text,p_label text) returns uuid language plpgsql security definer set search_path='' as $$
declare d uuid;begin
 if p_bootstrap is not null then
 insert into public.bootstrap_uses(token_hash) values(p_bootstrap);
 else
 update public.device_challenges set used_at=now() where id=p_challenge and token_hash=p_code and browser_hash=p_browser and expires_at>now() and used_at is null;
 if not found then raise exception 'FORBIDDEN';end if;
 end if;
 insert into public.authorized_devices(token_hash,label,expires_at) values(p_token,p_label,now()+interval '90 days') returning id into d;
 insert into public.audit_events(entity,entity_id,action,after_data) values('authorized_devices',d,'authorized',jsonb_build_object('label',p_label,'actor','Sistema'));
 return d;
 exception when unique_violation then raise exception 'FORBIDDEN';end $$;
revoke all on function public.enroll_device(text,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.enroll_device(text,uuid,text,text,text,text) to service_role;
