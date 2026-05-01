import { getSupabaseClient } from '@/platform/services/supabaseClient.js';

const CUSTOMER_SESSION_KEY = 'cote_customer_session';

const authErrorMessages = {
  invalid_credentials: 'E-mail ou senha inválidos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
  user_already_exists: 'Já existe uma conta com este e-mail.',
  weak_password: 'Use uma senha mais forte.',
  signup_disabled: 'Cadastro indisponível no momento.'
};

const normalizeAuthError = (error) => {
  const code = error?.code || error?.name;
  return authErrorMessages[code] || error?.message || 'Não foi possível autenticar agora.';
};

const buildCustomer = (user) => {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const fullName = [metadata.name, metadata.lastName].filter(Boolean).join(' ').trim();

  return {
    id: user.id,
    name: fullName || metadata.full_name || user.email?.split('@')[0] || 'Cliente',
    email: user.email || '',
    cpf: metadata.cpf || '',
    createdAt: user.created_at || null
  };
};

const clearLegacyMockSession = () => {
  try {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  } catch {
    // Best-effort cleanup for old mock sessions.
  }
};

const normalizeSession = (session) => ({
  authenticated: Boolean(session?.user),
  mode: 'supabase',
  customer: buildCustomer(session?.user),
  accessToken: session?.access_token || null,
  expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
});

export const registerCustomer = async (credentials = {}) => {
  const supabase = getSupabaseClient();
  const email = String(credentials.email || '').trim().toLowerCase();
  const password = String(credentials.password || '');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: String(credentials.name || '').trim(),
        lastName: String(credentials.lastName || '').trim(),
        cpf: String(credentials.cpf || '').trim()
      }
    }
  });

  if (error) throw new Error(normalizeAuthError(error));

  clearLegacyMockSession();

  return {
    ...normalizeSession(data.session),
    pendingConfirmation: Boolean(data.user && !data.session),
    customer: buildCustomer(data.user) || normalizeSession(data.session).customer
  };
};

export const loginCustomer = async (credentials = {}) => {
  const supabase = getSupabaseClient();
  const email = String(credentials.email || '').trim().toLowerCase();
  const password = String(credentials.password || '');

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(normalizeAuthError(error));

  clearLegacyMockSession();
  return normalizeSession(data.session);
};

export const logoutCustomer = async () => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  clearLegacyMockSession();
  if (error) throw new Error(normalizeAuthError(error));
  return { authenticated: false };
};

export const getCurrentCustomer = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(normalizeAuthError(error));
  clearLegacyMockSession();
  return data.session ? normalizeSession(data.session) : null;
};

export const getCustomerAccessToken = async () => {
  const session = await getCurrentCustomer();
  return session?.accessToken || null;
};

export const onCustomerAuthStateChange = (callback) => {
  const supabase = getSupabaseClient();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ? normalizeSession(session) : null);
  });
  return () => data.subscription.unsubscribe();
};

export const authAdapter = {
  registerCustomer,
  loginCustomer,
  logoutCustomer,
  getCurrentCustomer,
  getCustomerAccessToken,
  onCustomerAuthStateChange
};
