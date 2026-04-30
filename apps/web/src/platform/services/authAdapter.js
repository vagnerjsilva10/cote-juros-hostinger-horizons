const CUSTOMER_SESSION_KEY = 'cote_customer_session';

export const loginCustomer = async (credentials = {}) => {
  // TODO: criar auth real de cliente. Não usar autenticação de admin/superadmin para cliente comum.
  const email = String(credentials.email || '').trim().toLowerCase();
  const session = {
    authenticated: Boolean(email),
    mode: 'mock',
    customer: {
      id: `local_customer_${Date.now()}`,
      name: credentials.name || email.split('@')[0] || 'Cliente',
      email
    },
    createdAt: new Date().toISOString()
  };

  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  return session;
};

export const logoutCustomer = async () => {
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  return { authenticated: false };
};

export const getCurrentCustomer = () => {
  try {
    return JSON.parse(window.localStorage.getItem(CUSTOMER_SESSION_KEY) || 'null');
  } catch {
    return null;
  }
};

export const authAdapter = {
  loginCustomer,
  logoutCustomer,
  getCurrentCustomer
};
