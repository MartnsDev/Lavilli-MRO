-- TEST ONLY. No fixture is installed by production migrations except mechanic names.
create schema tests;
create table tests.fixtures(name text primary key,id uuid not null);
create function tests.id(n text) returns uuid language sql as $$select id from tests.fixtures where name=n$$;
create function tests.assert(ok boolean,msg text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAIL: %',msg;end if;raise notice 'PASS: %',msg;end$$;
insert into public.authorized_devices(token_hash,label,expires_at,authorization_version) values ('test-device','Dispositivo TESTE',now()+interval '1 day',1) returning id as device \gset
insert into public.access_sessions(device_id,credential_version,elevated_until,mechanic_id,token_hash,expires_at) values (:'device','test-credential',now()+interval '1 hour',(select id from public.mechanics where name='César'),'test-session',now()+interval '1 day') returning id as session \gset
insert into tests.fixtures values('session',:'session'),('device',:'device');
create function tests.call(command jsonb,operation uuid default gen_random_uuid()) returns jsonb language plpgsql as $$
declare c uuid;h text;begin
 h:=encode(digest(command::text,'sha256'),'hex');
 insert into public.confirmations(session_id,mechanic_id,operation_hash,expires_at) values(tests.id('session'),(select id from public.mechanics where name='César'),h,now()+interval '2 minutes') returning id into c;
 return public.run_operation(tests.id('session'),c,operation,h,command);
end$$;
create function tests.create(entity text,data jsonb,n text) returns uuid language plpgsql as $$declare r jsonb;begin r:=tests.call(jsonb_build_object('action','create','entity',entity,'data',data,'reason','Cadastro TESTE'));insert into tests.fixtures values(n,(r->>'id')::uuid);return (r->>'id')::uuid;end$$;
select tests.create('locations','{"name":"Oficina TESTE","code":"TEST-OF","kind":"workshop","active":true}','location');
select tests.create('locations','{"name":"Recebimento TESTE","code":"TEST-RC","kind":"receiving","active":true}','receiving');
select tests.create('part_catalog','{"name":"Peça TESTE","part_number":"TEST-PN","unit":"un","minimum_stock":5}','part');
select tests.create('stock_lots',jsonb_build_object('catalog_id',tests.id('part'),'code','TEST-LOT','location_id',tests.id('location'),'condition','serviceable','documentation','complete'),'lot');
select tests.create('stock_lots',jsonb_build_object('catalog_id',tests.id('part'),'code','TEST-RACE','location_id',tests.id('location'),'condition','serviceable','documentation','complete'),'race_lot');
select tests.create('tools',jsonb_build_object('name','Ferramenta TESTE','code','TEST-T1','location_id',tests.id('location'),'calibration_required',false),'tool');
select tests.create('tools',jsonb_build_object('name','Corrida TESTE','code','TEST-T2','location_id',tests.id('location'),'calibration_required',false),'race_tool');
select tests.create('tools',jsonb_build_object('name','Calibrável TESTE','code','TEST-CAL','location_id',tests.id('location'),'calibration_required',true),'cal_tool');
select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('lot'),'kind','receive','quantity',10),'reason','Recebimento TESTE'));
select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('race_lot'),'kind','receive','quantity',10),'reason','Recebimento TESTE'));
select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('lot'),'kind','verify','quantity',1,'condition','serviceable','documentation','complete'),'reason','Conferência TESTE'));
select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('race_lot'),'kind','verify','quantity',1,'condition','serviceable','documentation','complete'),'reason','Conferência TESTE'));
select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('lot'),'kind','reserve','quantity',3),'reason','Reserva TESTE'));
select tests.assert((select quantity=10 and reserved=3 from public.stock_lots where id=tests.id('lot')),'reservation preserves physical quantity');
do $$begin
 begin perform tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('lot'),'kind','consume','quantity',8),'reason','Saída impossível'));raise exception 'unexpected';exception when others then if sqlerrm<>'INSUFFICIENT_STOCK' then raise;end if;end;
 perform tests.assert((select quantity=10 and reserved=3 from public.stock_lots where id=tests.id('lot')),'failed withdrawal rolls back');
 begin perform tests.call(jsonb_build_object('action','tool_checkout','data',jsonb_build_object('tool_id',tests.id('cal_tool'),'destination','Oficina'),'reason','Calibração pendente'));raise exception 'unexpected';exception when others then if sqlerrm<>'UNAVAILABLE' then raise;end if;end;
 perform tests.assert(not exists(select 1 from public.tool_checkouts where tool_id=tests.id('cal_tool')),'calibratable tool blocked without valid calibration');
 begin perform public.run_operation(tests.id('session'),gen_random_uuid(),gen_random_uuid(),'fake','{"action":"create","entity":"mechanics","data":{"name":"Forged"}}');raise exception 'unexpected';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 perform tests.assert(not exists(select 1 from public.mechanics where name='Forged'),'mutation without confirmation rejected');
 begin update public.audit_events set action='tampered';raise exception 'unexpected';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
end$$;
select tests.create('aircraft','{"registration":"PT-TST","model":"TESTE"}','aircraft');
select tests.create('part_instances',jsonb_build_object('catalog_id',tests.id('part'),'serial_number','TEST-SN','location_id',tests.id('location'),'condition','serviceable','documentation','complete'),'instance');
select tests.call(jsonb_build_object('action','part_move','data',jsonb_build_object('part_id',tests.id('instance'),'version',1,'kind','install','aircraft_id',tests.id('aircraft'),'position','TESTE'),'reason','Instalação registrada TESTE'));
select tests.assert((select logistics='installed' and location_id is null and aircraft_id=tests.id('aircraft') from public.part_instances where id=tests.id('instance')),'serialized unit has one current position');
select tests.call(jsonb_build_object('action','part_move','data',jsonb_build_object('part_id',tests.id('instance'),'version',2,'kind','remove','location_id',tests.id('location')),'reason','Remoção registrada TESTE'));
select tests.assert((select condition='pending' and documentation='pending' and aircraft_id is null from public.part_instances where id=tests.id('instance')),'removed part requires reassessment');
select tests.create('maintenance_tasks','{"name":"Tarefa TESTE","priority":"normal"}','task');
select tests.create('work_orders','{"name":"OS TESTE","priority":"normal"}','order');
select tests.call(jsonb_build_object('action','update','entity','maintenance_tasks','id',tests.id('task'),'version',1,'data',jsonb_build_object('name','Tarefa TESTE','priority','normal','work_order_id',tests.id('order')),'reason','Vínculo posterior à OS'));
select tests.assert((select count(*)>=2 from public.audit_events where entity_id=tests.id('task')),'linking task to order preserves identity and history');
do $$begin
 begin perform tests.call(jsonb_build_object('action','task_status','entity','work_orders','data',jsonb_build_object('id',tests.id('order'),'version',1,'status','administratively_complete'),'reason','Encerramento TESTE'));raise exception 'unexpected';exception when others then if sqlerrm<>'UNAVAILABLE' then raise;end if;end;
 begin perform tests.call(jsonb_build_object('action','update','entity','maintenance_tasks','id',tests.id('task'),'version',1,'data','{"name":"Stale"}'::jsonb,'reason','Versão antiga'));raise exception 'unexpected';exception when others then if sqlerrm<>'CONFLICT' then raise;end if;end;
end$$;
select tests.create('organizations','{"name":"Terceiro TESTE","kind":"third_party"}','third_party');
select tests.create('external_shipments',jsonb_build_object('name','Remessa TESTE','recipient_id',tests.id('third_party'),'purpose','Reparo'),'shipment');
select tests.call(jsonb_build_object('action','shipment_add','data',jsonb_build_object('shipment_id',tests.id('shipment'),'lot_id',tests.id('lot'),'quantity',4),'reason','Item remessa TESTE'));
insert into tests.fixtures select 'shipment_item',id from public.external_shipment_items where shipment_id=tests.id('shipment');
select tests.call(jsonb_build_object('action','shipment_dispatch','data',jsonb_build_object('shipment_id',tests.id('shipment')),'reason','Envio externo TESTE'));
select tests.call(jsonb_build_object('action','shipment_return','data',jsonb_build_object('item_id',tests.id('shipment_item'),'quantity',2,'location_id',tests.id('receiving')),'reason','Retorno parcial TESTE'));
select tests.assert((select returned_quantity=2 from public.external_shipment_items where id=tests.id('shipment_item')),'partial return preserves external custody balance');
select tests.assert(exists(select 1 from public.stock_lots where code like 'TEST-LOT-RET-%' and quantity=2 and condition='pending' and documentation='pending'),'external return is never approved automatically');
select tests.create('tool_kits','{"name":"Kit TESTE","code":"TEST-KIT","require_check":true}','kit');
select tests.create('tool_kit_items',jsonb_build_object('kit_id',tests.id('kit'),'tool_id',tests.id('tool')),'kit_item');
select tests.call(jsonb_build_object('action','kit_checkout','data',jsonb_build_object('kit_id',tests.id('kit'),'checked_tool_ids',jsonb_build_array(tests.id('tool')),'destination','Oficina'),'reason','Retirada kit TESTE'));
select tests.call(jsonb_build_object('action','kit_return','data',jsonb_build_object('kit_id',tests.id('kit'),'checked_tool_ids','[]'::jsonb,'location_id',tests.id('location')),'reason','Retorno com falta TESTE'));
select tests.assert(exists(select 1 from public.tool_discrepancies where tool_id=tests.id('tool') and status='open'),'missing kit item creates persistent discrepancy');
select public.generate_alerts();select public.generate_alerts();
select tests.assert((select count(*)=count(distinct source_key) from public.alerts),'scheduled alerts deduplicate');
select tests.assert(not has_table_privilege('anon','public.stock_lots','SELECT'),'anonymous cannot read operational tables');
select tests.assert(not has_function_privilege('anon','public.run_operation(uuid,uuid,uuid,text,jsonb)','EXECUTE'),'anonymous cannot execute mutation RPC');
select tests.assert(not has_function_privilege('authenticated','public.generate_alerts()','EXECUTE'),'authenticated Data API role cannot run jobs');
select tests.assert((select bool_and(rowsecurity) from pg_tables where schemaname='public'),'all operational tables have RLS');
select tests.assert(exists(select 1 from public.audit_events where mechanic_id=(select id from public.mechanics where name='César') and before_data is not null and after_data is not null),'audit stores declared actor and diffs');
-- Confirmation expiry, request binding and revoked devices are checked inside the transaction.
do $$declare conf uuid;begin
 insert into public.confirmations(session_id,mechanic_id,operation_hash,expires_at) values(tests.id('session'),(select id from public.mechanics where name='César'),'bound-hash',now()-interval '1 second') returning id into conf;
 begin perform public.run_operation(tests.id('session'),conf,gen_random_uuid(),'bound-hash','{}');raise exception 'unexpected';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 insert into public.confirmations(session_id,mechanic_id,operation_hash,expires_at) values(tests.id('session'),(select id from public.mechanics where name='César'),'bound-hash',now()+interval '1 minute') returning id into conf;
 begin perform public.run_operation(tests.id('session'),conf,gen_random_uuid(),'tampered-hash','{}');raise exception 'unexpected';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 perform tests.assert(true,'expired or tampered confirmation rejected');
 update public.access_sessions set revoked_at=now() where id=tests.id('session');
 begin perform public.run_operation(tests.id('session'),conf,gen_random_uuid(),'bound-hash','{}');raise exception 'unexpected';exception when others then if sqlerrm<>'UNAUTHORIZED' then raise;end if;end;
 update public.access_sessions set revoked_at=null where id=tests.id('session');
 perform tests.assert(true,'revoked session cannot access business operations');
end$$;
do $$begin
 perform public.enroll_device('TEST-bootstrap',null,null,null,'TEST-new-device','Dispositivo TESTE bootstrap');
 begin perform public.enroll_device('TEST-bootstrap',null,null,null,'TEST-new-device-2','Reutilização TESTE');raise exception 'unexpected';exception when others then if sqlerrm<>'FORBIDDEN' then raise;end if;end;
 perform tests.assert(true,'bootstrap code consumed exactly once');
 for i in 1..5 loop perform public.take_attempt('TEST-rate',5);end loop;
 begin perform public.take_attempt('TEST-rate',5);raise exception 'unexpected';exception when others then if sqlerrm<>'RATE_LIMIT' then raise;end if;end;
 perform tests.assert(true,'persistent rate limit blocks sixth attempt');
end$$;
select tests.create('notification_recipients','{"name":"Destinatário TESTE","email":"test@example.invalid","active":true}','recipient');
select tests.create('notification_rules','{"name":"Regra TESTE","enabled":true,"days_before":30,"email_enabled":true}','rule');
select public.generate_alerts();select public.generate_alerts();
select tests.assert((select count(*)=(select count(*) from public.alerts where status='open') from public.email_deliveries),'outbox deduplicates alert and recipient');
select tests.create('locations','{"name":"Inativo TESTE","code":"TEST-INACTIVE","kind":"other","active":false}','inactive_location');
do $$begin
 begin perform tests.call(jsonb_build_object('action','create','entity','tools','data',jsonb_build_object('name','Inválido','code','TEST-INACTIVE-TOOL','location_id',tests.id('inactive_location'),'calibration_required',false),'reason','Tentativa TESTE'));raise exception 'unexpected';exception when others then if sqlerrm<>'UNAVAILABLE' then raise;end if;end;
 begin perform tests.call(jsonb_build_object('action','archive','entity','locations','id',tests.id('location'),'version',(select version from public.locations where id=tests.id('location')),'reason','Local ocupado TESTE'));raise exception 'unexpected';exception when others then if sqlerrm<>'UNAVAILABLE' then raise;end if;end;
 perform tests.assert(true,'occupied or inactive locations are protected');
end$$;
select tests.call(jsonb_build_object('action','stock','data',jsonb_build_object('lot_id',tests.id('lot'),'kind','consume','quantity',1,'task_id',tests.id('task'),'work_order_id',tests.id('order'),'aircraft_id',tests.id('aircraft')),'reason','Material vinculado ao serviço TESTE'));
select tests.assert(exists(select 1 from public.stock_movements where task_id=tests.id('task') and work_order_id=tests.id('order') and aircraft_id=tests.id('aircraft')),'material event links task order and aircraft atomically');
-- An absent mutation target must fail and roll back its audit and operation result.
do $$declare before_count bigint;begin
 select count(*) into before_count from public.audit_events;
 begin perform tests.call(jsonb_build_object('action','alert_status','data',jsonb_build_object('id',gen_random_uuid(),'status','resolved'),'reason','Alerta inexistente TESTE'));raise exception 'unexpected';exception when others then if sqlerrm<>'NOT_FOUND' then raise;end if;end;
 begin perform tests.call(jsonb_build_object('action','inventory_close','data',jsonb_build_object('id',gen_random_uuid()),'reason','Inventário inexistente TESTE'));raise exception 'unexpected';exception when others then if sqlerrm<>'NOT_FOUND' then raise;end if;end;
 perform tests.assert((select count(*)=before_count from public.audit_events),'missing target rejects operation without orphan audit');
end$$;
