create function public.run_operation(p_session uuid,p_confirmation uuid,p_operation uuid,p_hash text,p_command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare conf public.confirmations; actor uuid; result jsonb; old_result public.operation_results; action text:=p_command->>'action'; entity text:=p_command->>'entity'; data jsonb:=p_command->'data'; row_id uuid; old_row jsonb; new_row jsonb; columns text; selectors text; permitted jsonb; lot public.stock_lots; tool public.tools; checkout public.tool_checkouts; reservation public.stock_reservations; shipment public.external_shipments; shipment_item public.external_shipment_items; inst public.part_instances; count_item public.physical_count_items; amount numeric; dest uuid; reason text:=p_command->>'reason'; state text; target text; v int; kit public.tool_kits; item record; seen uuid[]; import_id uuid; import_row jsonb; row_number int; success_count int; error_count int; import_error text;
begin
 if not exists(select 1 from public.access_sessions s join public.authorized_devices d on d.id=s.device_id where s.id=p_session and s.revoked_at is null and s.expires_at>now() and d.revoked_at is null and d.expires_at>now()) then raise exception 'UNAUTHORIZED';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_operation::text,0));
 select * into old_result from public.operation_results where id=p_operation;
 if found then if old_result.session_id<>p_session or old_result.operation_hash<>p_hash then raise exception 'FORBIDDEN';end if; return old_result.result;end if;
 select * into conf from public.confirmations where id=p_confirmation for update;
 if not found or conf.session_id<>p_session or conf.operation_hash<>p_hash or conf.used_at is not null or conf.expires_at<now() then raise exception 'FORBIDDEN';end if;
 if not exists(select 1 from public.mechanics where id=conf.mechanic_id and active) then raise exception 'FORBIDDEN';end if;
 actor:=conf.mechanic_id; update public.confirmations set used_at=now() where id=conf.id;
 perform set_config('app.mechanic_id',actor::text,true); perform set_config('app.operation_id',p_operation::text,true);perform set_config('app.reason',coalesce(reason,''),true);
permitted:='{"locations": ["name", "code", "parent_id", "kind", "active"], "organizations": ["name", "kind", "email", "phone"], "aircraft": ["registration", "manufacturer", "model", "serial_number", "location_id", "status"], "part_catalog": ["name", "part_number", "manufacturer", "category", "unit", "minimum_stock"], "part_instances": ["catalog_id", "serial_number", "owner_id", "location_id", "condition", "documentation"], "stock_lots": ["catalog_id", "code", "location_id", "owner_id", "supplier_id", "expires_at", "condition", "documentation"], "physical_counts": ["name", "location_id"], "tools": ["name", "code", "brand", "model", "serial_number", "owner_id", "location_id", "calibration_required"], "tool_kits": ["name", "code", "require_check"], "tool_kit_items": ["kit_id", "tool_id"], "tool_inspections": ["tool_id", "kit_id", "name", "notes", "status", "aircraft_id"], "tool_discrepancies": ["tool_id", "name", "aircraft_id", "task_id", "status", "notes"], "maintenance_tasks": ["name", "description", "aircraft_id", "work_order_id", "mechanic_id", "priority", "due_at"], "work_orders": ["name", "description", "aircraft_id", "mechanic_id", "priority", "due_at"], "external_shipments": ["name", "recipient_id", "purpose", "tracking_code", "carrier", "expected_return"], "external_tracking_events": ["shipment_id", "name", "notes"], "documents": ["name", "category", "reference_url", "notes", "expires_at"], "mechanics": ["name", "active"], "notification_rules": ["name", "enabled", "days_before", "email_enabled"], "notification_recipients": ["name", "email", "active"], "app_settings": ["name", "value"], "activity_comments": ["entity", "entity_id", "body"], "document_links": ["document_id", "entity", "entity_id"]}'::jsonb;

 if action in ('create','update','archive') then
 if not permitted ? entity then raise exception 'INVALID_OPERATION';end if;
 if action='archive' then
 if entity in ('stock_lots','part_instances','tools','physical_counts','tool_kits','tool_kit_items','work_orders','maintenance_tasks','external_shipments','external_tracking_events','tool_inspections','tool_discrepancies','documents','mechanics','activity_comments') then raise exception 'INVALID_OPERATION';end if;
 row_id:=(p_command->>'id')::uuid;
 if entity='locations' and (exists(select 1 from public.stock_lots where location_id=row_id and quantity>0) or exists(select 1 from public.tools where location_id=row_id and archived_at is null) or exists(select 1 from public.part_instances where location_id=row_id and archived_at is null) or exists(select 1 from public.locations where parent_id=row_id and archived_at is null)) then raise exception 'UNAVAILABLE';end if;
 execute format('update public.%I set archived_at=now() where id=$1 and version=$2 returning to_jsonb(%I.*)',entity,entity) into result using row_id,(p_command->>'version')::int;
 if result is null then raise exception 'CONFLICT';end if;
 else
 if jsonb_typeof(data)<>'object' or data='{}'::jsonb or exists(select 1 from jsonb_object_keys(data) k where not (permitted->entity ? k)) then raise exception 'INVALID_OPERATION';end if;
 -- immutable identifiers keep correct scoped uniqueness and history.
 if action='update' and (entity in ('external_shipments','part_instances','stock_lots','tool_kit_items','tool_inspections','activity_comments','external_tracking_events') or (entity='aircraft' and data ? 'registration')) then raise exception 'INVALID_OPERATION';end if;
 if entity='locations' and data->>'active'='false' and (exists(select 1 from public.stock_lots where location_id=(p_command->>'id')::uuid and quantity>0) or exists(select 1 from public.tools where location_id=(p_command->>'id')::uuid and archived_at is null) or exists(select 1 from public.part_instances where location_id=(p_command->>'id')::uuid and archived_at is null)) then raise exception 'UNAVAILABLE';end if;
 if entity in ('activity_comments','document_links') then
 if data->>'entity' not in ('part_instances','tools','stock_lots','aircraft','maintenance_tasks','work_orders','external_shipments','organizations','tool_calibrations','stock_movements') then raise exception 'INVALID_OPERATION';end if;
 execute format('select id from public.%I where id=$1',data->>'entity') into row_id using (data->>'entity_id')::uuid;
 if row_id is null then raise exception 'NOT_FOUND';end if;
 end if;
 if entity='tool_kit_items' then
 perform 1 from public.tool_kits where id=(data->>'kit_id')::uuid for update;
 select * into tool from public.tools where id=(data->>'tool_id')::uuid for update;
 if not found or tool.status<>'available' then raise exception 'UNAVAILABLE';end if;
 end if;
 if entity='tools' and action='update' then
 select * into tool from public.tools where id=(p_command->>'id')::uuid for update;
 if tool.status='in_use' and (data->>'location_id')::uuid is distinct from tool.location_id then raise exception 'UNAVAILABLE';end if;
 end if;
 if entity='activity_comments' then data:=data||jsonb_build_object('mechanic_id',actor);end if;
 if entity='tool_inspections' and data->>'status'='complete' and data->>'kit_id' is not null then raise exception 'INVALID_OPERATION';end if;
 select string_agg(format('%I',k),','),string_agg(format('r.%I',k),',') into columns,selectors from jsonb_object_keys(data) k;
 if action='create' then
 execute format('insert into public.%I(%s) select %s from jsonb_populate_record(null::public.%I,$1) r returning to_jsonb(%I.*)',entity,columns,selectors,entity,entity) into result using data;
 else
 row_id:=(p_command->>'id')::uuid;
 execute format('update public.%I set (%s)=(select %s from jsonb_populate_record(null::public.%I,$1) r) where id=$2 and version=$3 returning to_jsonb(%I.*)',entity,columns,selectors,entity,entity) into result using data,row_id,(p_command->>'version')::int;
 if result is null then raise exception 'CONFLICT';end if;
 end if;
 end if;
 elsif action='stock' then
 select * into lot from public.stock_lots where id=(data->>'lot_id')::uuid and archived_at is null for update;
 if not found then raise exception 'NOT_FOUND';end if;
 amount:=(data->>'quantity')::numeric; state:=data->>'kind';
 if amount is null or amount<=0 or coalesce(reason,'')='' then raise exception 'INVALID_OPERATION';end if;
 if state in ('consume','reserve','transfer','dispatch') and (lot.condition<>'serviceable' or lot.documentation<>'complete' or lot.expires_at<(now() at time zone 'America/Sao_Paulo')::date) then raise exception 'UNAVAILABLE';end if;
 if state='receive' then
 update public.stock_lots set quantity=quantity+amount,condition='pending',documentation='pending' where id=lot.id;
 elsif state='reserve' then
 if lot.quantity-lot.reserved<amount then raise exception 'INSUFFICIENT_STOCK';end if;
 update public.stock_lots set reserved=reserved+amount where id=lot.id;
 insert into public.stock_reservations(lot_id,quantity,purpose) values(lot.id,amount,reason) returning id into row_id;
 elsif state in ('release','consume_reserved') then
 select * into reservation from public.stock_reservations where id=(data->>'reservation_id')::uuid and lot_id=lot.id and status='active' for update;
 if not found or reservation.quantity<>amount then raise exception 'INVALID_OPERATION';end if;
 if state='consume_reserved' and (lot.condition<>'serviceable' or lot.documentation<>'complete' or lot.expires_at<(now() at time zone 'America/Sao_Paulo')::date) then raise exception 'UNAVAILABLE';end if;
 update public.stock_reservations set status=case when state='release' then 'released' else 'consumed' end where id=reservation.id;
 update public.stock_lots set reserved=reserved-amount,quantity=quantity-case when state='release' then 0 else amount end where id=lot.id;
 elsif state in ('consume','discard','transfer') then
 if lot.quantity-lot.reserved<amount then raise exception 'INSUFFICIENT_STOCK';end if;
 update public.stock_lots set quantity=quantity-amount where id=lot.id;
 if state='transfer' then
 dest:=(data->>'destination_id')::uuid;
 if dest is null or dest=lot.location_id or not exists(select 1 from public.locations where id=dest and active and archived_at is null) then raise exception 'INVALID_OPERATION';end if;
 -- Locks and unique lot/location constraint serialize simultaneous transfers.
 insert into public.stock_lots(catalog_id,code,location_id,owner_id,supplier_id,quantity,expires_at,opened_at,condition,documentation,unit_cost) values(lot.catalog_id,lot.code,dest,lot.owner_id,lot.supplier_id,amount,lot.expires_at,lot.opened_at,lot.condition,lot.documentation,lot.unit_cost)
 on conflict(catalog_id,code,location_id) do update set quantity=public.stock_lots.quantity+excluded.quantity where public.stock_lots.condition=excluded.condition and public.stock_lots.documentation=excluded.documentation and public.stock_lots.owner_id is not distinct from excluded.owner_id and public.stock_lots.expires_at is not distinct from excluded.expires_at;
 if not found then raise exception 'CONFLICT';end if;
 end if;
 elsif state='verify' then
 update public.stock_lots set condition=data->>'condition',documentation=data->>'documentation' where id=lot.id;amount:=0;
 else raise exception 'INVALID_OPERATION';end if;
 insert into public.stock_movements(lot_id,kind,quantity,destination_id,reason,operation_id,reservation_id,task_id,work_order_id,aircraft_id) values(lot.id,state,amount,dest,reason,p_operation,coalesce((data->>'reservation_id')::uuid,row_id),(data->>'task_id')::uuid,(data->>'work_order_id')::uuid,(data->>'aircraft_id')::uuid) returning to_jsonb(stock_movements.*) into result;
 elsif action='tool_checkout' then
 select * into tool from public.tools where id=(data->>'tool_id')::uuid and archived_at is null for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if tool.status<>'available' or (tool.calibration_required and (tool.calibration_due is null or tool.calibration_due<(now() at time zone 'America/Sao_Paulo')::date)) or exists(select 1 from public.tool_discrepancies where tool_id=tool.id and status<>'resolved') or exists(select 1 from public.tool_kit_items where tool_id=tool.id) then raise exception 'UNAVAILABLE';end if;
 update public.tools set status='in_use' where id=tool.id;
 insert into public.tool_checkouts(tool_id,mechanic_id,destination,aircraft_id,task_id,work_order_id,due_at) values(tool.id,actor,data->>'destination',(data->>'aircraft_id')::uuid,(data->>'task_id')::uuid,(data->>'work_order_id')::uuid,(data->>'due_at')::timestamptz) returning to_jsonb(tool_checkouts.*) into result;
 elsif action='tool_return' then
 select * into tool from public.tools where id=(data->>'tool_id')::uuid for update;
 select * into checkout from public.tool_checkouts where tool_id=tool.id and returned_at is null for update;
 if not found then raise exception 'UNAVAILABLE';end if;
 state:=data->>'condition';dest:=(data->>'location_id')::uuid;
 if state not in ('available','damaged','quarantine','missing') or dest is null then raise exception 'INVALID_OPERATION';end if;
 if state='available' and exists(select 1 from public.tool_discrepancies where tool_id=tool.id and status<>'resolved') then state:='quarantine';end if;
 update public.tool_checkouts set returned_at=now(),return_condition=state,return_location_id=dest where id=checkout.id;
 update public.tools set status=state,location_id=dest where id=tool.id;
 if state<>'available' then insert into public.tool_discrepancies(tool_id,name,aircraft_id,task_id,notes) values(tool.id,'Divergência na devolução',checkout.aircraft_id,checkout.task_id,reason);end if;
 result:=jsonb_build_object('id',checkout.id);
 elsif action='tool_condition' then
 state:=data->>'status';if state not in ('available','damaged','maintenance','quarantine','missing','retired','calibration') then raise exception 'INVALID_OPERATION';end if;
 select * into tool from public.tools where id=(data->>'tool_id')::uuid for update;
 if not found or tool.status='in_use' then raise exception 'UNAVAILABLE';end if;
 if state='available' and (exists(select 1 from public.tool_discrepancies where tool_id=tool.id and status<>'resolved') or (tool.calibration_required and (tool.calibration_due is null or tool.calibration_due<(now() at time zone 'America/Sao_Paulo')::date))) then raise exception 'UNAVAILABLE';end if;
 update public.tools set status=state where id=tool.id;
 if state='missing' then insert into public.tool_discrepancies(tool_id,name,notes) values(tool.id,'Ferramenta não localizada',reason);end if;result:=jsonb_build_object('id',tool.id);
 elsif action='calibration' then
 select * into tool from public.tools where id=(data->>'tool_id')::uuid for update;
 if not found or tool.status='in_use' then raise exception 'UNAVAILABLE';end if;
 insert into public.tool_calibrations(tool_id,performed_at,due_at,result,certificate_reference) values(tool.id,(data->>'performed_at')::date,(data->>'due_at')::date,data->>'result',data->>'certificate_reference') returning to_jsonb(tool_calibrations.*) into result;
 update public.tools set calibration_due=(data->>'due_at')::date,status=case when data->>'result'='accepted' then 'quarantine' else 'damaged' end where id=tool.id;
 elsif action='task_status' then
 if entity not in ('maintenance_tasks','work_orders') then raise exception 'INVALID_OPERATION';end if;
 row_id:=(data->>'id')::uuid;target:=data->>'status';
 execute format('select to_jsonb(r.*) from public.%I r where id=$1 for update',entity) into old_row using row_id;
 if old_row is null then raise exception 'NOT_FOUND';end if;
 if (old_row->>'version')::int<>(data->>'version')::int then raise exception 'CONFLICT';end if;
 if old_row->>'status' in ('administratively_complete','cancelled') and (target<>'open' or coalesce(reason,'')='') then raise exception 'INVALID_OPERATION';end if;
 if target not in ('open','in_progress','waiting_part','waiting_tool','waiting_document','waiting_inspection','paused','administratively_complete','cancelled') then raise exception 'INVALID_OPERATION';end if;
 if entity='work_orders' and target='administratively_complete' and exists(select 1 from public.maintenance_tasks where work_order_id=row_id and status not in ('administratively_complete','cancelled')) then raise exception 'UNAVAILABLE';end if;
 execute format('update public.%I set status=$1,closed_at=case when $1 in (''administratively_complete'',''cancelled'') then now() else null end where id=$2 returning to_jsonb(%I.*)',entity,entity) into result using target,row_id;
 elsif action='part_move' then
 select * into inst from public.part_instances where id=(data->>'part_id')::uuid for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if inst.version<>(data->>'version')::int then raise exception 'CONFLICT';end if;
 state:=data->>'kind';
 if inst.logistics in ('external','transit') then raise exception 'UNAVAILABLE';end if;
 if state='install' then
 if inst.logistics='installed' or inst.condition<>'serviceable' or inst.documentation<>'complete' or data->>'aircraft_id' is null then raise exception 'UNAVAILABLE';end if;
 update public.part_instances set logistics='installed',aircraft_id=(data->>'aircraft_id')::uuid,position=data->>'position',location_id=null where id=inst.id;
 elsif state in ('transfer','remove','unknown') then
 if state='transfer' and inst.logistics='installed' then raise exception 'INVALID_OPERATION';end if;
 if state='remove' and inst.logistics<>'installed' then raise exception 'INVALID_OPERATION';end if;
 if state<>'unknown' and data->>'location_id' is null then raise exception 'INVALID_OPERATION';end if;
 update public.part_instances set logistics=case when state='unknown' then 'unknown' else 'stored' end,location_id=case when state='unknown' then null else (data->>'location_id')::uuid end,aircraft_id=null,position=null,condition=case when state='remove' then 'pending' else condition end,documentation=case when state='remove' then 'pending' else documentation end where id=inst.id;
 else raise exception 'INVALID_OPERATION';end if;
 result:=jsonb_build_object('id',inst.id);
 elsif action='inventory_count' then
 select * into lot from public.stock_lots where id=(data->>'lot_id')::uuid for update;
 if not found or not exists(select 1 from public.physical_counts where id=(data->>'count_id')::uuid and status='open' and location_id=lot.location_id) then raise exception 'INVALID_OPERATION';end if;
 amount:=(data->>'counted')::numeric;
 insert into public.physical_count_items(count_id,lot_id,expected,counted) values((data->>'count_id')::uuid,lot.id,lot.quantity,amount) returning to_jsonb(physical_count_items.*) into result;
 elsif action='inventory_reconcile' then
 select * into count_item from public.physical_count_items where id=(data->>'id')::uuid for update;
 if not found or count_item.reconciled then raise exception 'INVALID_OPERATION';end if;
 select * into lot from public.stock_lots where id=count_item.lot_id for update;
 if lot.quantity<>count_item.expected or count_item.counted<lot.reserved then raise exception 'CONFLICT';end if;
 update public.stock_lots set quantity=count_item.counted where id=lot.id;
 insert into public.stock_movements(lot_id,kind,quantity,reason,operation_id) values(lot.id,'count_adjustment',count_item.counted-count_item.expected,reason,p_operation);
 update public.physical_count_items set reconciled=true where id=count_item.id;result:=jsonb_build_object('id',count_item.id);
 elsif action='alert_status' then
 state:=data->>'status';if state not in ('acknowledged','resolved') then raise exception 'INVALID_OPERATION';end if;
 update public.alerts set status=state,notes=reason where id=(data->>'id')::uuid returning to_jsonb(alerts.*) into result;
 insert into public.audit_events(entity,entity_id,action,after_data,mechanic_id,operation_id,reason) values('alerts',(data->>'id')::uuid,'status',result,actor,p_operation,reason);
 elsif action='revoke_device' then
 update public.authorized_devices set revoked_at=now() where id=(data->>'id')::uuid;
 update public.access_sessions set revoked_at=now() where device_id=(data->>'id')::uuid;
 insert into public.audit_events(entity,entity_id,action,mechanic_id,operation_id,reason) values('authorized_devices',(data->>'id')::uuid,'revoked',actor,p_operation,reason);result:='{}';

 elsif action='part_verify' then
 update public.part_instances set condition=data->>'condition',documentation=data->>'documentation' where id=(data->>'part_id')::uuid and version=(data->>'version')::int and logistics not in ('installed','external','transit') returning to_jsonb(part_instances.*) into result;if result is null then raise exception 'CONFLICT';end if;
 elsif action='aircraft_registration' then
 update public.aircraft set registration=data->>'registration' where id=(data->>'id')::uuid and version=(data->>'version')::int returning to_jsonb(aircraft.*) into result;if result is null then raise exception 'CONFLICT';end if;
 elsif action='inventory_close' then
 row_id:=(data->>'id')::uuid;
 if exists(select 1 from public.physical_count_items where count_id=row_id and not reconciled) then raise exception 'UNAVAILABLE';end if;
 update public.physical_counts set status='closed' where id=row_id and status='open' returning to_jsonb(physical_counts.*) into result;
 elsif action in ('kit_checkout','kit_return') then
 select * into kit from public.tool_kits where id=(data->>'kit_id')::uuid for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if not exists(select 1 from public.tool_kit_items where kit_id=kit.id) then raise exception 'INVALID_OPERATION';end if;
 seen:=array(select jsonb_array_elements_text(data->'checked_tool_ids')::uuid);
 for tool in select t.* from public.tools t join public.tool_kit_items k on k.tool_id=t.id where k.kit_id=kit.id order by t.id for update of t loop
 if action='kit_checkout' then
 if not(tool.id=any(seen)) or tool.status<>'available' or (tool.calibration_required and (tool.calibration_due is null or tool.calibration_due<(now() at time zone 'America/Sao_Paulo')::date)) or exists(select 1 from public.tool_discrepancies where tool_id=tool.id and status<>'resolved') then raise exception 'UNAVAILABLE';end if;
 update public.tools set status='in_use' where id=tool.id;
 insert into public.tool_checkouts(tool_id,mechanic_id,destination,aircraft_id,due_at) values(tool.id,actor,data->>'destination',(data->>'aircraft_id')::uuid,(data->>'due_at')::timestamptz);
 else
 select * into checkout from public.tool_checkouts where tool_id=tool.id and returned_at is null for update;
 if not found then raise exception 'UNAVAILABLE';end if;
 state:=case when tool.id=any(seen) then 'available' else 'missing' end;
 if state='available' and exists(select 1 from public.tool_discrepancies where tool_id=tool.id and status<>'resolved') then state:='quarantine';end if;
 update public.tools set status=state,location_id=(data->>'location_id')::uuid where id=tool.id;
 update public.tool_checkouts set returned_at=now(),return_condition=state,return_location_id=(data->>'location_id')::uuid where id=checkout.id;
 if state='missing' then insert into public.tool_discrepancies(tool_id,name,aircraft_id,task_id,notes) values(tool.id,'Item faltante no retorno do kit',checkout.aircraft_id,checkout.task_id,reason);end if;
 end if;
 end loop;
 insert into public.tool_inspections(kit_id,name,status,notes) values(kit.id,case when action='kit_checkout' then 'Conferência de saída' else 'Conferência de retorno' end,case when exists(select 1 from public.tools t join public.tool_kit_items k on k.tool_id=t.id where k.kit_id=kit.id and t.status='missing') then 'discrepancy' else 'complete' end,reason);
 result:=jsonb_build_object('id',kit.id);
 elsif action='shipment_add' then
 select * into shipment from public.external_shipments where id=(data->>'shipment_id')::uuid for update;
 if not found or shipment.status<>'preparing' then raise exception 'UNAVAILABLE';end if;
 if exists(select 1 from public.external_shipment_items where shipment_id=shipment.id and ((lot_id=(data->>'lot_id')::uuid) or (part_instance_id=(data->>'part_instance_id')::uuid))) then raise exception 'CONFLICT';end if;
 insert into public.external_shipment_items(shipment_id,lot_id,part_instance_id,quantity) values(shipment.id,(data->>'lot_id')::uuid,(data->>'part_instance_id')::uuid,(data->>'quantity')::numeric) returning to_jsonb(external_shipment_items.*) into result;
 elsif action='shipment_dispatch' then
 select * into shipment from public.external_shipments where id=(data->>'shipment_id')::uuid for update;
 if not found or shipment.status<>'preparing' or not exists(select 1 from public.external_shipment_items where shipment_id=shipment.id) then raise exception 'UNAVAILABLE';end if;
 for shipment_item in select * from public.external_shipment_items where shipment_id=shipment.id order by lot_id,part_instance_id loop
 if shipment_item.lot_id is not null then
 select * into lot from public.stock_lots where id=shipment_item.lot_id for update;
 if lot.quantity-lot.reserved<shipment_item.quantity then raise exception 'INSUFFICIENT_STOCK';end if;
 update public.stock_lots set quantity=quantity-shipment_item.quantity where id=lot.id;
 insert into public.stock_movements(lot_id,kind,quantity,reason,operation_id) values(lot.id,'external_dispatch',shipment_item.quantity,reason,p_operation);
 else
 select * into inst from public.part_instances where id=shipment_item.part_instance_id for update;
 if inst.logistics<>'stored' then raise exception 'UNAVAILABLE';end if;
 update public.part_instances set logistics='external',location_id=null where id=inst.id;
 end if;
 end loop;
 update public.external_shipments set status='dispatched' where id=shipment.id returning to_jsonb(external_shipments.*) into result;
 elsif action='shipment_return' then
 -- Lock parent first, matching dispatch lock order.
 select s.* into shipment from public.external_shipments s join public.external_shipment_items i on i.shipment_id=s.id where i.id=(data->>'item_id')::uuid for update of s;
 select * into shipment_item from public.external_shipment_items where id=(data->>'item_id')::uuid for update;
 amount:=(data->>'quantity')::numeric;dest:=(data->>'location_id')::uuid;
 if shipment_item.id is null or shipment.status in ('preparing','administratively_closed') or amount<=0 or shipment_item.returned_quantity+amount>shipment_item.quantity then raise exception 'INVALID_OPERATION';end if;
 if shipment_item.lot_id is not null then
 select * into lot from public.stock_lots where id=shipment_item.lot_id for update;
 -- A separate receipt lot avoids changing condition of material still stored internally.
 insert into public.stock_lots(catalog_id,code,location_id,owner_id,supplier_id,quantity,expires_at,condition,documentation) values(lot.catalog_id,lot.code||'-RET-'||left(p_operation::text,8),dest,lot.owner_id,lot.supplier_id,amount,lot.expires_at,'pending','pending') returning id into row_id;
 insert into public.stock_movements(lot_id,kind,quantity,reason,operation_id) values(row_id,'external_return',amount,reason,p_operation);
 else
 if amount<>1 then raise exception 'INVALID_OPERATION';end if;
 update public.part_instances set logistics='stored',location_id=dest,condition='pending',documentation='pending' where id=shipment_item.part_instance_id;
 end if;
 update public.external_shipment_items set returned_quantity=returned_quantity+amount where id=shipment_item.id;
 if not exists(select 1 from public.external_shipment_items where shipment_id=shipment.id and returned_quantity<quantity) then update public.external_shipments set status='pending_verification' where id=shipment.id;end if;
 result:=jsonb_build_object('id',shipment_item.id);
 elsif action='shipment_status' then
 select * into shipment from public.external_shipments where id=(data->>'shipment_id')::uuid for update;state:=data->>'status';
 if not found or shipment.status in ('preparing','administratively_closed') then raise exception 'INVALID_OPERATION';end if;
 if state='administratively_closed' and (shipment.status<>'pending_verification' or exists(select 1 from public.external_shipment_items where shipment_id=shipment.id and returned_quantity<quantity)) then raise exception 'UNAVAILABLE';end if;
 if state='pending_verification' and exists(select 1 from public.external_shipment_items where shipment_id=shipment.id and returned_quantity<quantity) then raise exception 'UNAVAILABLE';end if;
 update public.external_shipments set status=state where id=shipment.id returning to_jsonb(external_shipments.*) into result;
 elsif action='document_version' then
 perform 1 from public.documents where id=(data->>'document_id')::uuid for update;
 if not found then raise exception 'NOT_FOUND';end if;
 select coalesce(max(revision),0)+1 into v from public.document_versions where document_id=(data->>'document_id')::uuid;
 insert into public.document_versions(document_id,revision,object_path,mime_type,size_bytes,sha256,mechanic_id) values((data->>'document_id')::uuid,v,data->>'object_path',data->>'mime_type',(data->>'size_bytes')::bigint,data->>'sha256',actor) returning to_jsonb(document_versions.*) into result;

 elsif action='import_rows' then
 entity:=data->>'category';if entity not in ('locations','organizations','aircraft','part_catalog','tools','stock_lots') then raise exception 'INVALID_OPERATION';end if;
 if jsonb_array_length(data->'rows')>100 then raise exception 'INVALID_OPERATION';end if;
 insert into public.import_jobs(name,category,total_rows,mechanic_id) values(data->>'name',entity,jsonb_array_length(data->'rows'),actor) returning id into import_id;
 row_number:=0;success_count:=0;error_count:=0;
 for import_row in select value from jsonb_array_elements(data->'rows') loop
 row_number:=row_number+1;import_error:=null;
 begin
 if import_row='{}'::jsonb or exists(select 1 from jsonb_object_keys(import_row) k where not (permitted->entity ? k)) then raise exception 'INVALID_OPERATION';end if;
 select string_agg(format('%I',k),','),string_agg(format('r.%I',k),',') into columns,selectors from jsonb_object_keys(import_row) k;
 execute format('insert into public.%I(%s) select %s from jsonb_populate_record(null::public.%I,$1) r returning id',entity,columns,selectors,entity) into row_id using import_row;
 success_count:=success_count+1;
 exception when unique_violation then import_error:=case when data->>'mode'='skip_duplicates' then 'Duplicado ignorado' else 'Registro duplicado' end;error_count:=error_count+1;
 when check_violation or foreign_key_violation or not_null_violation or invalid_text_representation then import_error:='Dados inválidos ou referência inexistente';error_count:=error_count+1;
 end;
 insert into public.import_job_rows(job_id,row_number,data,error) values(import_id,row_number,import_row,import_error);
 end loop;
 update public.import_jobs set success_rows=success_count,error_rows=error_count,status=case when error_count=0 then 'completed' else 'partial' end where id=import_id;
 result:=jsonb_build_object('id',import_id,'success_rows',success_count,'error_rows',error_count);
 else raise exception 'INVALID_OPERATION';end if;
 insert into public.operation_results(id,session_id,operation_hash,result) values(p_operation,p_session,p_hash,coalesce(result,'{}'));
 return coalesce(result,'{}');
 exception when unique_violation or deadlock_detected or serialization_failure then raise exception 'CONFLICT'; when check_violation or foreign_key_violation or invalid_text_representation or not_null_violation then raise exception 'INVALID_OPERATION';
end $$;
revoke all on function public.run_operation(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.run_operation(uuid,uuid,uuid,text,jsonb) to service_role;
