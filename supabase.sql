-- Выполните это в Supabase: Project -> SQL Editor -> New query -> Run

create table if not exists kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Включаем Row Level Security
alter table kv_store enable row level security;

-- Разрешаем анонимному ключу (anon) читать и писать.
-- Это ОБЩИЙ игровой мир без сервера — все посетители сайта
-- используют один и тот же anon-ключ, поэтому доступ на чтение/запись
-- открыт для всех, кто открыл страницу (как и было в оригинальной задумке
-- с window.storage: shared = true для всех).
create policy "kv_store_select_anon"
  on kv_store for select
  to anon
  using (true);

create policy "kv_store_insert_anon"
  on kv_store for insert
  to anon
  with check (true);

create policy "kv_store_update_anon"
  on kv_store for update
  to anon
  using (true)
  with check (true);
