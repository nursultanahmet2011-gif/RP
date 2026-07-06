import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Не заданы VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
      "Смотрите README.md — нужно создать проект Supabase и прописать переменные окружения."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLE = "kv_store";

/**
 * Загружает значение по ключу из общей таблицы kv_store.
 * Второй параметр (shared) сохранён для совместимости с исходным
 * интерфейсом window.storage, но игнорируется: в этом проекте
 * всё хранилище общее (весь игровой мир один на всех).
 */
export async function loadKey(key, fallback) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value ?? fallback;
  } catch (e) {
    console.error("loadKey error", key, e);
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) console.error("saveKey error", key, error);
  } catch (e) {
    console.error("saveKey error", key, e);
  }
}
