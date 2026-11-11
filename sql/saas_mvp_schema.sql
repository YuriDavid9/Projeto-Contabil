-- ============================================================================
-- AutoContábil SaaS (MVP) — Evolução do Banco de Dados (Supabase / PostgreSQL)
-- Compatível com o schema existente em sql/schema.sql
-- ============================================================================

-- 1. Evolui a tabela public.profiles para suportar o tipo de conta do SaaS
-- ('mei' para Empresa/MEI e 'contador' para Contadores parceiros)
alter table public.profiles
  add column if not exists account_type text not null default 'mei'
    check (account_type in ('mei', 'contador')),
  add column if not exists company_name text,
  add column if not exists cnpj text,
  add column if not exists accountant_code text unique;

-- Atualiza o gatilho de criação automática de perfil para gravar account_type e company_name
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, account_type, company_name, cnpj)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
                  'Usuário ' || substr(new.id::text, 1, 6)), 50),
    case
      when new.raw_user_meta_data->>'account_type' in ('mei', 'contador')
        then new.raw_user_meta_data->>'account_type'
      else 'mei'
    end,
    left(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), 100),
    left(nullif(trim(new.raw_user_meta_data->>'cnpj'), ''), 20)
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        account_type = excluded.account_type,
        company_name = coalesce(excluded.company_name, public.profiles.company_name),
        cnpj = coalesce(excluded.cnpj, public.profiles.cnpj);
  return new;
end $$;

-- Permissão para o próprio usuário atualizar seus dados de perfil da empresa
grant update (display_name, account_type, company_name, cnpj) on public.profiles to authenticated;

-- 2. Vínculo entre Empresa/MEI e Contador
create table if not exists public.client_accountant_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  accountant_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('pending', 'active', 'archived')),
  created_at timestamptz not null default now(),
  unique (client_id, accountant_id)
);

-- 3. Lotes de Extratos Bancários enviados/organizados pela Empresa/MEI
create table if not exists public.statement_batches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  accountant_id uuid references public.profiles(id) on delete set null,
  reference_month text not null check (reference_month ~ '^[0-9]{4}-[0-9]{2}$'), -- ex.: '2026-10'
  bank_name text not null default 'Banco não informado',
  source_filename text not null,
  source_format text not null check (source_format in ('OFX', 'CSV', 'DEMO')),
  status text not null default 'organized' check (status in ('organized', 'sent_to_accountant', 'reviewed')),
  total_income numeric(14,2) not null default 0,
  total_expense numeric(14,2) not null default 0,
  total_transfer numeric(14,2) not null default 0,
  total_other numeric(14,2) not null default 0,
  transaction_count int not null default 0,
  client_notes text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists statement_batches_client_idx on public.statement_batches (client_id, reference_month desc);
create index if not exists statement_batches_accountant_idx on public.statement_batches (accountant_id, reference_month desc);

-- 4. Movimentações organizadas e classificadas de cada extrato
create table if not exists public.statement_transactions (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.statement_batches(id) on delete cascade,
  tx_date date not null,
  description text not null,
  amount numeric(14,2) not null,
  category text not null check (category in ('receita', 'despesa', 'transferencia', 'outros')),
  plain_explanation text,
  needs_invoice_check boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists statement_transactions_batch_idx on public.statement_transactions (batch_id, tx_date);

-- 5. Checklist Mensal de Obrigações do MEI
create table if not exists public.mei_checklist_progress (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  reference_month text not null check (reference_month ~ '^[0-9]{4}-[0-9]{2}$'),
  task_key text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (client_id, reference_month, task_key)
);

-- ============================================================================
-- SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.client_accountant_links enable row level security;
alter table public.statement_batches       enable row level security;
alter table public.statement_transactions  enable row level security;
alter table public.mei_checklist_progress  enable row level security;

-- Vínculos: cliente e contador vinculados podem ler; cliente pode criar/atualizar seu vínculo
create policy links_select on public.client_accountant_links for select
  to authenticated
  using (auth.uid() = client_id or auth.uid() = accountant_id);

create policy links_insert on public.client_accountant_links for insert
  to authenticated
  with check (auth.uid() = client_id);

-- Lotes de extratos: o dono (MEI) vê e edita tudo; o contador vinculado vê os lotes enviados para ele
create policy batches_select on public.statement_batches for select
  to authenticated
  using (
    auth.uid() = client_id
    or auth.uid() = accountant_id
    or exists (
      select 1 from public.client_accountant_links l
      where l.client_id = statement_batches.client_id
        and l.accountant_id = auth.uid()
        and l.status = 'active'
    )
  );

create policy batches_insert on public.statement_batches for insert
  to authenticated
  with check (auth.uid() = client_id);

create policy batches_update on public.statement_batches for update
  to authenticated
  using (auth.uid() = client_id or auth.uid() = accountant_id)
  with check (auth.uid() = client_id or auth.uid() = accountant_id);

create policy batches_delete on public.statement_batches for delete
  to authenticated
  using (auth.uid() = client_id);

-- Movimentações: visíveis para quem tem acesso ao lote (MEI dono ou Contador vinculado)
create policy transactions_select on public.statement_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.statement_batches b
      where b.id = statement_transactions.batch_id
        and (
          b.client_id = auth.uid()
          or b.accountant_id = auth.uid()
          or exists (
            select 1 from public.client_accountant_links l
            where l.client_id = b.client_id
              and l.accountant_id = auth.uid()
              and l.status = 'active'
          )
        )
    )
  );

create policy transactions_insert on public.statement_transactions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.statement_batches b
      where b.id = statement_transactions.batch_id
        and b.client_id = auth.uid()
    )
  );

create policy transactions_update on public.statement_transactions for update
  to authenticated
  using (
    exists (
      select 1 from public.statement_batches b
      where b.id = statement_transactions.batch_id
        and b.client_id = auth.uid()
    )
  );

-- Checklist do MEI: apenas o próprio MEI lê e atualiza
create policy checklist_all_own on public.mei_checklist_progress for all
  to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);

grant select, insert, update, delete on public.client_accountant_links to authenticated;
grant select, insert, update, delete on public.statement_batches to authenticated;
grant select, insert, update, delete on public.statement_transactions to authenticated;
grant select, insert, update, delete on public.mei_checklist_progress to authenticated;
