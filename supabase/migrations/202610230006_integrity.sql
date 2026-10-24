-- A tool has one current kit assignment. Historical assignments remain in audit.
create unique index one_kit_per_tool on public.tool_kit_items(tool_id) where archived_at is null;
create index document_entity_link on public.document_links(entity,entity_id);
create index external_open_items on public.external_shipment_items(shipment_id);
create index tree_parent on public.locations(parent_id);
-- Protect the last active declared actor against accidental administrative lockout.
create function public.guard_last_mechanic() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform pg_advisory_xact_lock(619512);
 if OLD.active and not NEW.active and (select count(*) from public.mechanics where active and id<>OLD.id)=0 then raise exception 'UNAVAILABLE';end if;
 return NEW;end $$;
create trigger protect_last_mechanic before update on public.mechanics for each row execute function public.guard_last_mechanic();
revoke all on function public.guard_last_mechanic() from public,anon,authenticated;

create function public.require_active_location() returns trigger language plpgsql security definer set search_path='' as $$
declare linked uuid;begin
 linked:=(to_jsonb(NEW)->>TG_ARGV[0])::uuid;
 if linked is not null then
 perform 1 from public.locations where id=linked and active and archived_at is null for share;
 if not found then raise exception 'UNAVAILABLE';end if;
 end if;return NEW;end $$;
create trigger lot_active_location before insert or update of location_id on public.stock_lots for each row execute function public.require_active_location('location_id');
create trigger part_active_location before insert or update of location_id on public.part_instances for each row execute function public.require_active_location('location_id');
create trigger tool_active_location before insert or update of location_id on public.tools for each row execute function public.require_active_location('location_id');
create trigger aircraft_active_location before insert or update of location_id on public.aircraft for each row execute function public.require_active_location('location_id');
create trigger parent_active_location before insert or update of parent_id on public.locations for each row execute function public.require_active_location('parent_id');
create function public.protect_occupied_location() returns trigger language plpgsql security definer set search_path='' as $$begin
 if not NEW.active or NEW.archived_at is not null then
 if exists(select 1 from public.stock_lots where location_id=OLD.id and quantity>0)
 or exists(select 1 from public.part_instances where location_id=OLD.id and archived_at is null)
 or exists(select 1 from public.tools where location_id=OLD.id and archived_at is null)
 or exists(select 1 from public.aircraft where location_id=OLD.id and status='active' and archived_at is null)
 or exists(select 1 from public.locations where parent_id=OLD.id and active and archived_at is null)
 then raise exception 'UNAVAILABLE';end if;
 end if;return NEW;end $$;
create trigger keep_occupied_location before update on public.locations for each row execute function public.protect_occupied_location();
revoke all on function public.require_active_location(),public.protect_occupied_location() from public,anon,authenticated;

-- Material use is traced from the stock event itself, avoiding duplicate balances.
alter table public.stock_movements add column task_id uuid references public.maintenance_tasks;
alter table public.stock_movements add column work_order_id uuid references public.work_orders;
alter table public.stock_movements add column aircraft_id uuid references public.aircraft;
create index movement_task on public.stock_movements(task_id,created_at);
create index movement_order on public.stock_movements(work_order_id,created_at);
create index movement_aircraft on public.stock_movements(aircraft_id,created_at);
