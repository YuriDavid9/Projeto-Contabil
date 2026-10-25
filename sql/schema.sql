-- ============ TABELAS ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 50),
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id serial primary key,
  slug text unique not null,
  name text not null
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 5 and 160),
  summary text not null check (char_length(summary) <= 300),
  content_md text not null,
  category_id int references public.categories(id),
  source_name text,                -- ex.: "Receita Federal"
  source_url text,                 -- link da fonte oficial
  cover_url text,                  -- URL de imagem (upload fica para depois)
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  author_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_published_idx on public.posts (status, published_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

-- ============ FUNÇÕES E GATILHOS ============
-- Cria o perfil automaticamente quando alguém se cadastra.
-- Nome padrão NÃO usa o e-mail (privacidade).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
                  'Contador ' || substr(new.id::text, 1, 6)), 50)
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.posts_before_write() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger posts_before_write_trg
before insert or update on public.posts
for each row execute function public.posts_before_write();

-- Antispam simples: no máximo 1 comentário a cada 20 segundos por usuário.
create function public.comments_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.comments
             where user_id = new.user_id and created_at > now() - interval '20 seconds') then
    raise exception 'Aguarde alguns segundos antes de comentar novamente.';
  end if;
  return new;
end $$;

create trigger comments_rate_limit_trg
before insert on public.comments
for each row execute function public.comments_rate_limit();

-- ============ SEGURANÇA (RLS) ============
alter table public.profiles   enable row level security;
alter table public.categories enable row level security;
alter table public.posts      enable row level security;
alter table public.comments   enable row level security;

-- profiles: todos leem (só nome e papel; o e-mail fica em auth.users, privado)
create policy profiles_select on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
-- usuário comum só pode alterar o próprio NOME; ninguém vira admin pelo site
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- categories: todos leem; só admin escreve
create policy categories_select on public.categories for select using (true);
create policy categories_admin_write on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- posts: público vê só publicadas; admin vê e faz tudo
create policy posts_select on public.posts for select
  using (status = 'published' or public.is_admin());
create policy posts_admin_insert on public.posts for insert with check (public.is_admin());
create policy posts_admin_update on public.posts for update
  using (public.is_admin()) with check (public.is_admin());
create policy posts_admin_delete on public.posts for delete using (public.is_admin());

-- comments
create policy comments_select on public.comments for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or (hidden = false and exists (
         select 1 from public.posts p where p.id = post_id and p.status = 'published'))
  );
create policy comments_insert on public.comments for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );
create policy comments_delete on public.comments for delete
  using (auth.uid() = user_id or public.is_admin());
create policy comments_admin_hide on public.comments for update
  using (public.is_admin()) with check (public.is_admin());
revoke update on public.comments from anon, authenticated;
grant update (hidden) on public.comments to authenticated;  -- e a policy acima limita a admin
