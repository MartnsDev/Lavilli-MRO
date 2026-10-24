create function public.generate_alerts() returns int language plpgsql security definer set search_path='' as $$
declare rec record; alert_id uuid; inserted int:=0; days int;begin
 perform pg_advisory_xact_lock(716519);
 select coalesce(max(days_before),15) into days from public.notification_rules where enabled and archived_at is null;
 for rec in
 select 'tool-missing-'||id::text as key,'Ferramenta não localizada: '||code as name,'critical' as severity,'tools' as entity,id from public.tools where status='missing' and archived_at is null
 union all select 'calibration-'||id::text||'-'||coalesce(calibration_due::text,'pending'),'Calibração pendente ou próxima: '||code,case when calibration_due<(now() at time zone 'America/Sao_Paulo')::date or calibration_due is null then 'critical' else 'warning' end,'tools',id from public.tools where calibration_required and (calibration_due is null or calibration_due<=(now() at time zone 'America/Sao_Paulo')::date+days) and archived_at is null and status<>'retired'
 union all select 'expiry-'||id::text||'-'||expires_at::text,'Validade do lote: '||code,case when expires_at<(now() at time zone 'America/Sao_Paulo')::date then 'critical' else 'warning' end,'stock_lots',id from public.stock_lots where quantity>0 and expires_at<=(now() at time zone 'America/Sao_Paulo')::date+days and archived_at is null
 union all select 'task-overdue-'||id::text||'-'||due_at::text,'Tarefa vencida: '||name,'warning','maintenance_tasks',id from public.maintenance_tasks where due_at<now() and status not in ('administratively_complete','cancelled') and archived_at is null
 union all select 'order-overdue-'||id::text||'-'||due_at::text,'OS vencida: '||name,'warning','work_orders',id from public.work_orders where due_at<now() and status not in ('administratively_complete','cancelled') and archived_at is null
 union all select 'shipment-overdue-'||id::text||'-'||expected_return::text,'Remessa com retorno em atraso: '||name,'warning','external_shipments',id from public.external_shipments where expected_return<now() and status not in ('preparing','administratively_closed','pending_verification') and archived_at is null
 union all select 'checkout-overdue-'||id::text,'Retirada de ferramenta em atraso','warning','tool_checkouts',id from public.tool_checkouts where returned_at is null and due_at<now()
 union all select 'unknown-part-'||id::text,'Peça com localização desconhecida: '||serial_number,'critical','part_instances',id from public.part_instances where logistics='unknown' and archived_at is null
 union all select 'discrepancy-'||id::text,'Ocorrência aberta: '||name,'critical','tool_discrepancies',id from public.tool_discrepancies where status<>'resolved' and archived_at is null
 union all select 'low-stock-'||p.id::text,'Estoque abaixo do mínimo: '||p.name,'warning','part_catalog',p.id from public.part_catalog p left join public.stock_lots l on l.catalog_id=p.id and l.archived_at is null and l.condition='serviceable' and l.documentation='complete' and (l.expires_at is null or l.expires_at>=(now() at time zone 'America/Sao_Paulo')::date) where p.minimum_stock>0 and p.archived_at is null group by p.id having coalesce(sum(l.quantity-l.reserved),0)<p.minimum_stock
 loop
 alert_id:=null;
 insert into public.alerts(name,severity,source_key,entity,entity_id) values(rec.name,rec.severity,rec.key,rec.entity,rec.id) on conflict(source_key) do nothing returning id into alert_id;
 if alert_id is not null then inserted:=inserted+1;insert into public.audit_events(entity,entity_id,action,after_data) values('alerts',alert_id,'generated',jsonb_build_object('name',rec.name,'actor','Sistema'));end if;
 end loop;
 if exists(select 1 from public.notification_rules where enabled and email_enabled and archived_at is null) then
 insert into public.email_deliveries(alert_id,recipient_id,dedup_key)
 select a.id,r.id,a.id::text||':'||r.id::text from public.alerts a cross join public.notification_recipients r where a.status='open' and r.active and r.archived_at is null on conflict(dedup_key) do nothing;
 end if;
 return inserted;end $$;
create function public.claim_emails() returns setof public.email_deliveries language sql security definer set search_path='' as $$
 update public.email_deliveries set status='sending',attempts=attempts+1,lease_until=now()+interval '5 minutes' where id in (select id from public.email_deliveries where attempts<6 and ((status in ('pending','failed') and next_attempt_at<=now()) or (status='sending' and lease_until<now())) order by created_at for update skip locked limit 10) returning *;
$$;
create function public.reset_attempt(p_key text) returns void language sql security definer set search_path='' as $$ delete from public.access_attempts where key=p_key; $$;
revoke all on function public.generate_alerts(),public.claim_emails(),public.reset_attempt(text) from public,anon,authenticated;
grant execute on function public.generate_alerts(),public.claim_emails(),public.reset_attempt(text) to service_role;
