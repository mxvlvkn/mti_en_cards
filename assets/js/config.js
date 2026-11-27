/**
 * Настройки подключения к Supabase.
 *
 * Пока поля пустые — приложение работает полностью локально (localStorage),
 * без сети и без регистрации. Это нормальный режим для GitHub Pages.
 *
 * Чтобы включить синхронизацию между устройствами:
 *   1. Создайте проект на https://supabase.com
 *   2. Выполните sql/schema.sql в SQL Editor
 *   3. Вставьте сюда Project URL и anon public key (Settings → API)
 *
 * ВАЖНО: anon key публичный по дизайну — он попадает в бандл и виден всем.
 * Безопасность держится на RLS-политиках из schema.sql. Ключ service_role
 * сюда вставлять НЕЛЬЗЯ ни при каких условиях.
 */
export const CONFIG = {
  appName: 'Wordly',
  supabaseUrl: '',
  supabaseAnonKey: '',

  tables: {
    progress: 'card_progress',
    profiles: 'profiles'
  }
};

export const SYNC_ENABLED = Boolean(
  CONFIG.supabaseUrl && CONFIG.supabaseAnonKey
);
