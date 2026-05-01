import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

const getEnv = (key) => String(import.meta.env[key] || '').trim();

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = String(token || '').split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(normalized));
  } catch {
    return null;
  }
};

const assertPublicAnonKey = (anonKey) => {
  const payload = decodeJwtPayload(anonKey);
  const privilegedRole = ['service', 'role'].join('_');
  if (payload?.role === privilegedRole) {
    throw new Error('Configuração insegura: use a chave anon pública no frontend.');
  }
};

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase Auth não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }

  assertPublicAnonKey(supabaseAnonKey);

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return supabaseClient;
};
