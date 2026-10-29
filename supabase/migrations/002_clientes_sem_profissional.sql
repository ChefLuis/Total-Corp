-- Rode no SQL Editor (seguro repetir).
-- Clientes: profissionais só leem (alinhado com o RBAC do app); recepção, gerência e dono escrevem
drop policy if exists clients_write on public.clients;
create policy clients_write on public.clients for all to authenticated
  using (company_id = public.current_company_id()
         and public.current_app_role() in ('owner','manager','receptionist'))
  with check (company_id = public.current_company_id()
         and public.current_app_role() in ('owner','manager','receptionist'));
