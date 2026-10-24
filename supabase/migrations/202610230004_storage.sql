-- Supabase Storage only. Local PostgreSQL tests validate SQL domain separately.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('operational-documents','operational-documents',false,4194304,array['application/pdf','image/png','image/jpeg']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- No anon/authenticated policies are created. Server service role signs short-lived downloads.
