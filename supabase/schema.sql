-- =====================================================================
-- TOTAL CORP — Esquema do banco (Supabase / PostgreSQL)  ·  Fase 2A
-- Como usar: Supabase > SQL Editor > New query > cole TUDO > Run.
-- É seguro rodar mais de uma vez (idempotente).
-- Segurança: RLS ligado em todas as tabelas; cada empresa só enxerga
-- os próprios dados; o público (anon) só acessa via funções controladas.
-- =====================================================================

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- 1) TABELAS
-- ---------------------------------------------------------------------
create table if not exists public.companies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (char_length(name) between 2 and 120),
  trade_name          text,
  document            text,
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  segment             text not null default 'spa_wellness'
                      check (segment in ('spa_wellness','salon','barbershop','aesthetics','clinic')),
  theme_color         text not null default '#0F766E',
  logo_url            text,
  phone               text,
  email               text,
  subscription_status text not null default 'trialing'
                      check (subscription_status in ('trialing','active','past_due','suspended','canceled')),
  trial_ends_at       timestamptz not null default (now() + interval '7 days'),
  created_at          timestamptz not null default now()
);

create table if not exists public.units (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  name                 text not null,
  address_street       text default '',
  address_number       text default '',
  address_neighborhood text default '',
  address_city         text default '',
  address_state        text default '',
  address_zipcode      text default '',
  timezone             text not null default 'America/Sao_Paulo',
  phone                text default '',
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  role        text not null default 'receptionist'
              check (role in ('owner','manager','receptionist','professional','financial','super_admin')),
  phone       text,
  avatar_url  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  color       text not null default '#0F766E',
  sort_order  int  not null default 0
);

create table if not exists public.professionals (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  user_profile_id uuid references public.profiles(id) on delete set null,
  name            text not null,
  bio             text,
  role_title      text,
  pix_key         text,
  email           text,
  color_tag       text not null default '#0F766E',
  commission_rate numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  specialties     text[] not null default '{}',
  unit_ids        uuid[] not null default '{}',
  is_active       boolean not null default true,
  avatar_url      text,
  created_at      timestamptz not null default now()
);

create table if not exists public.services (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  category_id          uuid references public.service_categories(id) on delete set null,
  name                 text not null,
  description          text not null default '',
  duration_minutes     int  not null check (duration_minutes between 5 and 720),
  buffer_time_minutes  int  not null default 0 check (buffer_time_minutes between 0 and 240),
  price_cents          int  not null default 0 check (price_cents >= 0),
  is_online_bookable   boolean not null default true,
  requires_deposit     boolean not null default false,
  deposit_amount_cents int,
  professional_ids     uuid[] not null default '{}',
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

create table if not exists public.clients (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  name                 text not null,
  email                text,
  phone                text not null,
  document             text,
  birth_date           date,
  notes                text,
  tags                 text[] not null default '{}',
  credit_balance_cents int not null default 0,
  lgpd_consent         boolean not null default false,
  lgpd_consent_at      timestamptz,
  created_at           timestamptz not null default now(),
  unique (company_id, phone)
);

create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  unit_id          uuid not null references public.units(id) on delete restrict,
  client_id        uuid not null references public.clients(id) on delete restrict,
  professional_id  uuid not null references public.professionals(id) on delete restrict,
  service_id       uuid not null references public.services(id) on delete restrict,
  start_time       timestamptz not null,
  end_time         timestamptz not null,
  status           text not null default 'scheduled'
                   check (status in ('scheduled','confirmed','arrived','in_service','completed','canceled','no_show')),
  price_cents      int not null default 0 check (price_cents >= 0),
  notes            text,
  source           text not null default 'internal' check (source in ('internal','public')),
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  check (end_time > start_time),
  -- BLOQUEIO ATÔMICO: a mesma profissional nunca tem dois atendimentos ativos sobrepostos
  constraint appointments_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status not in ('canceled','no_show'))
);

create table if not exists public.schedule_blocks (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  unit_id          uuid references public.units(id) on delete cascade,
  professional_id  uuid not null references public.professionals(id) on delete cascade,
  start_time       timestamptz not null,
  end_time         timestamptz not null,
  reason           text not null default 'Bloqueio',
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  check (end_time > start_time),
  constraint blocks_no_overlap exclude using gist (
    professional_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  )
);

create table if not exists public.waitlist_entries (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  client_id        uuid not null references public.clients(id) on delete cascade,
  service_id       uuid not null references public.services(id) on delete cascade,
  professional_id  uuid references public.professionals(id) on delete set null,
  desired_date     date not null,
  notes            text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_units_company        on public.units(company_id);
create index if not exists idx_profiles_company     on public.profiles(company_id);
create index if not exists idx_professionals_comp   on public.professionals(company_id);
create index if not exists idx_services_company     on public.services(company_id);
create index if not exists idx_clients_company      on public.clients(company_id);
create index if not exists idx_appt_company_start   on public.appointments(company_id, start_time);
create index if not exists idx_appt_professional    on public.appointments(professional_id, start_time);
create index if not exists idx_blocks_professional  on public.schedule_blocks(professional_id, start_time);

-- ---------------------------------------------------------------------
-- 2) FUNÇÕES AUXILIARES (security definer evita recursão nas políticas)
-- ---------------------------------------------------------------------
create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

-- Bloqueio de agendamento em cima de horário bloqueado
create or replace function public.trg_appointment_vs_blocks()
returns trigger language plpgsql as $$
begin
  if new.status not in ('canceled','no_show') and exists (
    select 1 from public.schedule_blocks b
    where b.professional_id = new.professional_id
      and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
  ) then
    raise exception 'horario_bloqueado' using errcode = '23P01';
  end if;
  return new;
end $$;

drop trigger if exists appointment_vs_blocks on public.appointments;
create trigger appointment_vs_blocks
  before insert or update of start_time, end_time, status, professional_id on public.appointments
  for each row execute function public.trg_appointment_vs_blocks();

-- Impede referenciar cliente/profissional/serviço/unidade de OUTRA empresa
create or replace function public.trg_appointment_same_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.clients       where id = new.client_id       and company_id = new.company_id)
  or not exists (select 1 from public.professionals where id = new.professional_id and company_id = new.company_id)
  or not exists (select 1 from public.services      where id = new.service_id      and company_id = new.company_id)
  or not exists (select 1 from public.units         where id = new.unit_id         and company_id = new.company_id)
  then
    raise exception 'referencia_de_outra_empresa' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists appointment_same_company on public.appointments;
create trigger appointment_same_company
  before insert or update of company_id, client_id, professional_id, service_id, unit_id on public.appointments
  for each row execute function public.trg_appointment_same_company();

-- ---------------------------------------------------------------------
-- 3) SEGURANÇA POR LINHA (RLS)
-- ---------------------------------------------------------------------
alter table public.companies          enable row level security;
alter table public.units              enable row level security;
alter table public.profiles           enable row level security;
alter table public.service_categories enable row level security;
alter table public.professionals      enable row level security;
alter table public.services           enable row level security;
alter table public.clients            enable row level security;
alter table public.appointments       enable row level security;
alter table public.schedule_blocks    enable row level security;
alter table public.waitlist_entries   enable row level security;

-- Nada para o público anônimo nas tabelas (só pelas funções públicas abaixo)
revoke all on all tables in schema public from anon;

-- companies: lê a própria; só owner/manager altera dados básicos. Criar/excluir só por função.
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies for select to authenticated
  using (id = public.current_company_id());
drop policy if exists companies_update on public.companies;
create policy companies_update on public.companies for update to authenticated
  using (id = public.current_company_id() and public.current_app_role() in ('owner','manager'))
  with check (id = public.current_company_id());
revoke update on public.companies from authenticated;
grant update (name, trade_name, document, theme_color, logo_url, phone, email) on public.companies to authenticated;
revoke insert, delete on public.companies from authenticated;

-- profiles: vê colegas da empresa; edita só o próprio nome/telefone/foto
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- Tabelas de cadastro: todos da empresa leem; owner/manager escrevem
do $$
declare t text;
begin
  foreach t in array array['units','service_categories','professionals','services']
  loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select to authenticated
                    using (company_id = public.current_company_id())', t);
    execute format('drop policy if exists %1$s_write on public.%1$s', t);
    execute format('create policy %1$s_write on public.%1$s for all to authenticated
                    using (company_id = public.current_company_id() and public.current_app_role() in (''owner'',''manager''))
                    with check (company_id = public.current_company_id() and public.current_app_role() in (''owner'',''manager''))', t);
  end loop;
end $$;

-- Operação diária: clientes, agenda, bloqueios, lista de espera
do $$
declare t text;
begin
  foreach t in array array['clients','appointments','schedule_blocks','waitlist_entries']
  loop
    execute format('drop policy if exists %1$s_select on public.%1$s', t);
    execute format('create policy %1$s_select on public.%1$s for select to authenticated
                    using (company_id = public.current_company_id())', t);
    execute format('drop policy if exists %1$s_write on public.%1$s', t);
    execute format('create policy %1$s_write on public.%1$s for all to authenticated
                    using (company_id = public.current_company_id()
                           and public.current_app_role() in (''owner'',''manager'',''receptionist'',''professional''))
                    with check (company_id = public.current_company_id()
                           and public.current_app_role() in (''owner'',''manager'',''receptionist'',''professional''))', t);
  end loop;
end $$;

-- Clientes: profissionais só leem (alinhado com o RBAC do app); recepção, gerência e dono escrevem
drop policy if exists clients_write on public.clients;
create policy clients_write on public.clients for all to authenticated
  using (company_id = public.current_company_id()
         and public.current_app_role() in ('owner','manager','receptionist'))
  with check (company_id = public.current_company_id()
         and public.current_app_role() in ('owner','manager','receptionist'));

-- ---------------------------------------------------------------------
-- 4) FUNÇÕES DO SISTEMA (chamadas pelo app)
-- ---------------------------------------------------------------------

-- Primeiro acesso: cria a empresa, a unidade principal e o perfil de dono
create or replace function public.create_company_for_user(p_name text, p_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_company uuid;
  v_email text;
  v_slug text := lower(trim(p_slug));
begin
  if v_uid is null then raise exception 'nao_autenticado' using errcode = '28000'; end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'usuario_ja_possui_empresa' using errcode = '23505';
  end if;
  select email into v_email from auth.users where id = v_uid;

  insert into public.companies (name, trade_name, slug, email)
  values (trim(p_name), trim(p_name), v_slug, v_email)
  returning id into v_company;

  insert into public.units (company_id, name) values (v_company, 'Unidade Principal');
  insert into public.profiles (id, company_id, email, full_name, role)
  values (v_uid, v_company, v_email, coalesce(split_part(v_email,'@',1),''), 'owner');
  return v_company;
end $$;

-- ---------------------------------------------------------------------
-- 5) PORTAL PÚBLICO DE AGENDAMENTO (acessível sem login, de forma controlada)
-- ---------------------------------------------------------------------

-- Dados públicos da empresa: nunca expõe clientes, preços internos, comissões etc.
create or replace function public.public_get_company(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_company public.companies%rowtype;
begin
  select * into v_company from public.companies
   where slug = lower(p_slug) and subscription_status in ('trialing','active','past_due');
  if not found then return null; end if;
  return jsonb_build_object(
    'company', jsonb_build_object('id', v_company.id, 'name', v_company.name, 'trade_name', v_company.trade_name,
                 'slug', v_company.slug, 'theme_color', v_company.theme_color, 'logo_url', v_company.logo_url,
                 'phone', v_company.phone),
    'units', coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'address_street',u.address_street,
                 'address_number',u.address_number,'address_neighborhood',u.address_neighborhood,
                 'address_city',u.address_city,'phone',u.phone))
                 from public.units u where u.company_id = v_company.id and u.is_active), '[]'::jsonb),
    'services', coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'description',s.description,
                 'duration_minutes',s.duration_minutes,'price_cents',s.price_cents,'category_id',s.category_id,
                 'professional_ids',s.professional_ids))
                 from public.services s where s.company_id = v_company.id and s.is_active and s.is_online_bookable), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'color',c.color,'sort_order',c.sort_order))
                 from public.service_categories c where c.company_id = v_company.id), '[]'::jsonb),
    'professionals', coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'role_title',p.role_title,
                 'color_tag',p.color_tag,'unit_ids',p.unit_ids,'avatar_url',p.avatar_url))
                 from public.professionals p where p.company_id = v_company.id and p.is_active), '[]'::jsonb)
  );
end $$;

-- Horários ocupados de um dia (sem revelar quem é o cliente)
create or replace function public.public_busy_slots(p_slug text, p_professional uuid, p_day date)
returns table (start_time timestamptz, end_time timestamptz)
language sql stable security definer set search_path = public as $$
  with c as (select id from public.companies where slug = lower(p_slug)),
       win as (select (p_day::timestamp at time zone 'America/Sao_Paulo') as d0,
                      ((p_day + 1)::timestamp at time zone 'America/Sao_Paulo') as d1)
  select a.start_time, a.end_time
    from public.appointments a, c, win
   where a.company_id = c.id and a.professional_id = p_professional
     and a.status not in ('canceled','no_show')
     and a.start_time < win.d1 and a.end_time > win.d0
  union all
  select b.start_time, b.end_time
    from public.schedule_blocks b, c, win
   where b.company_id = c.id and b.professional_id = p_professional
     and b.start_time < win.d1 and b.end_time > win.d0
$$;

-- Cria agendamento vindo do link público. Regras: mínimo 1h de antecedência,
-- aceite LGPD obrigatório e conflito de horário bloqueado pelo banco.
create or replace function public.public_create_appointment(
  p_slug text, p_unit uuid, p_service uuid, p_professional uuid, p_start timestamptz,
  p_name text, p_phone text, p_email text, p_lgpd boolean)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_company uuid; v_service public.services%rowtype; v_client uuid; v_appt uuid;
  v_phone text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
begin
  select id into v_company from public.companies
   where slug = lower(p_slug) and subscription_status in ('trialing','active','past_due');
  if v_company is null then raise exception 'empresa_nao_encontrada'; end if;
  if not coalesce(p_lgpd, false) then raise exception 'consentimento_lgpd_obrigatorio'; end if;
  if char_length(trim(coalesce(p_name,''))) < 2 or char_length(p_name) > 120 then raise exception 'nome_invalido'; end if;
  if char_length(v_phone) < 10 or char_length(v_phone) > 13 then raise exception 'telefone_invalido'; end if;
  if p_start < now() + interval '1 hour' then raise exception 'antecedencia_minima_1h'; end if;
  if p_start > now() + interval '180 days' then raise exception 'data_muito_distante'; end if;

  select * into v_service from public.services
   where id = p_service and company_id = v_company and is_active and is_online_bookable;
  if not found then raise exception 'servico_indisponivel'; end if;
  if not exists (select 1 from public.professionals
                  where id = p_professional and company_id = v_company and is_active
                    and (cardinality(v_service.professional_ids) = 0 or id = any(v_service.professional_ids))) then
    raise exception 'profissional_indisponivel';
  end if;
  if not exists (select 1 from public.units where id = p_unit and company_id = v_company and is_active) then
    raise exception 'unidade_invalida';
  end if;

  insert into public.clients (company_id, name, phone, email, lgpd_consent, lgpd_consent_at)
  values (v_company, trim(p_name), v_phone, nullif(trim(coalesce(p_email,'')),''), true, now())
  on conflict (company_id, phone) do update
     set name = excluded.name,
         email = coalesce(excluded.email, public.clients.email),
         lgpd_consent = true,
         lgpd_consent_at = coalesce(public.clients.lgpd_consent_at, now())
  returning id into v_client;

  insert into public.appointments (company_id, unit_id, client_id, professional_id, service_id,
                                   start_time, end_time, status, price_cents, source)
  values (v_company, p_unit, v_client, p_professional, p_service, p_start,
          p_start + make_interval(mins => v_service.duration_minutes + v_service.buffer_time_minutes),
          'scheduled', v_service.price_cents, 'public')
  returning id into v_appt;
  return v_appt;
exception
  when exclusion_violation then raise exception 'horario_indisponivel';
end $$;

-- Permissões de execução
revoke all on function public.create_company_for_user(text,text) from public, anon;
grant execute on function public.create_company_for_user(text,text) to authenticated;
revoke all on function public.public_get_company(text) from public;
revoke all on function public.public_busy_slots(text,uuid,date) from public;
revoke all on function public.public_create_appointment(text,uuid,uuid,uuid,timestamptz,text,text,text,boolean) from public;
grant execute on function public.public_get_company(text) to anon, authenticated;
grant execute on function public.public_busy_slots(text,uuid,date) to anon, authenticated;
grant execute on function public.public_create_appointment(text,uuid,uuid,uuid,timestamptz,text,text,text,boolean) to anon, authenticated;
revoke all on function public.current_company_id() from public, anon;
revoke all on function public.current_app_role()  from public, anon;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.current_app_role()  to authenticated;
