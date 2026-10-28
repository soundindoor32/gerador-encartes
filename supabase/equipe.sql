-- =====================================================================
-- Gerador de Encartes — modo EQUIPE
-- Rode uma vez no SQL Editor do Supabase (depois do schema.sql).
-- A partir daqui, todas as contas cadastradas no projeto compartilham
-- lojas, categorias, produtos, encartes e modelos.
-- Quem pode entrar: só as contas que você criar no painel do Supabase
-- (mantenha "Allow new users to sign up" DESLIGADO).
-- As preferências (ex.: mapeamento de colunas) continuam individuais.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array['lojas','categorias','produtos','ofertas','encartes','modelos'] loop
    execute format('drop policy if exists "somente o dono" on public.%I', t);
    execute format('drop policy if exists "equipe" on public.%I', t);
    execute format('create policy "equipe" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Categorias passam a ser únicas para a equipe toda
drop index if exists public.categorias_nome_por_usuario;
create unique index if not exists categorias_nome_unico on public.categorias (lower(nome));

-- Fotos: cada um envia na própria pasta, mas a equipe pode trocar/apagar qualquer foto
drop policy if exists "imagens: ver a propria pasta" on storage.objects;
drop policy if exists "imagens: alterar na propria pasta" on storage.objects;
drop policy if exists "imagens: apagar da propria pasta" on storage.objects;
drop policy if exists "imagens: equipe ve" on storage.objects;
drop policy if exists "imagens: equipe altera" on storage.objects;
drop policy if exists "imagens: equipe apaga" on storage.objects;

create policy "imagens: equipe ve" on storage.objects for select to authenticated
  using (bucket_id = 'imagens');
create policy "imagens: equipe altera" on storage.objects for update to authenticated
  using (bucket_id = 'imagens');
create policy "imagens: equipe apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'imagens');
