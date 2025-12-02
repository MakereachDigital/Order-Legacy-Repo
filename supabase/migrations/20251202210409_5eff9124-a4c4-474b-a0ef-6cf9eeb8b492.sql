create policy public_select_products on public.products for select to public using (true);
create policy auth_insert_products on public.products for insert to authenticated with check (true);
create policy auth_update_products on public.products for update to authenticated using (true);
create policy auth_delete_products on public.products for delete to authenticated using (true);