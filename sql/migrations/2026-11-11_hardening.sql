-- Migração de endurecimento de segurança (2026-11-11)
-- Execute este script no SQL Editor do Supabase.

-- 1. Restringir colunas permitidas no INSERT de comentários para evitar falsificação de created_at ou hidden
revoke insert on public.comments from authenticated;
grant insert (post_id, user_id, body) on public.comments to authenticated;

-- 2. Forçar created_at := now() e hidden := false no gatilho de rate limit de comentários
create or replace function public.comments_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.comments
             where user_id = new.user_id and created_at > now() - interval '20 seconds') then
    raise exception 'Aguarde alguns segundos antes de comentar novamente.';
  end if;
  new.created_at := now();
  new.hidden := false;
  return new;
end $$;

-- 3. Exigir na policy comments_insert que o post alvo exista e esteja publicado
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'published'
    )
  );

-- 4. Validar esquema HTTP/HTTPS em source_url e cover_url da tabela public.posts
-- Para localizar linhas existentes que violem a regra antes de aplicar os constraints, execute:
--   select id, slug, source_url, cover_url
--   from public.posts
--   where (source_url is not null and source_url !~* '^https?://')
--      or (cover_url is not null and cover_url !~* '^https?://');

alter table public.posts drop constraint if exists posts_source_url_check;
alter table public.posts add constraint posts_source_url_check
  check (source_url is null or source_url ~* '^https?://');

alter table public.posts drop constraint if exists posts_cover_url_check;
alter table public.posts add constraint posts_cover_url_check
  check (cover_url is null or cover_url ~* '^https?://');
