import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { apiFetch, getStoredToken, setStoredToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  roles: string[];
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, jobTitle: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isHR: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const COMPANY_DOMAIN = '@hexaingenieros.com';

const isCompanyEmail = (email: string): boolean => email.trim().toLowerCase().endsWith(COMPANY_DOMAIN);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  const hydrate = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me');
      if (!res.ok) {
        setStoredToken(null);
        setUser(null);
        setRoles([]);
        setLoading(false);
        return;
      }
      const body = (await res.json()) as {
        user: { id: string; email: string };
        roles: string[];
      };
      setUser(body.user);
      setRoles(body.roles ?? []);
    } catch {
      setStoredToken(null);
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const signIn = async (email: string, password: string) => {
    if (!isCompanyEmail(email)) {
      return { error: `Solo se permiten correos ${COMPANY_DOMAIN}` };
    }
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: (body as { error?: string }).error ?? 'Error al iniciar sesión' };
      }
      const token = (body as { token?: string }).token;
      if (!token) {
        return { error: 'Respuesta inválida del servidor' };
      }
      setStoredToken(token);
      await hydrate();
      return { error: null };
    } catch (e) {
      if (e instanceof TypeError && String(e.message).toLowerCase().includes('fetch')) {
        return {
          error:
            'No se pudo conectar con el servidor. Arranca el API en otra terminal: npm run dev:cv (puerto 3847) o usa npm run dev:all para web + API a la vez.',
        };
      }
      const msg = e instanceof Error ? e.message : 'Error de red';
      return { error: msg };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, jobTitle: string) => {
    if (!isCompanyEmail(email)) {
      return { error: `Solo se permiten correos ${COMPANY_DOMAIN}` };
    }
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, jobTitle }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: (body as { error?: string }).error ?? 'Error al registrarse' };
      }
      const token = (body as { token?: string }).token;
      if (!token) {
        return { error: 'Respuesta inválida del servidor' };
      }
      setStoredToken(token);
      await hydrate();
      return { error: null };
    } catch (e) {
      if (e instanceof TypeError && String(e.message).toLowerCase().includes('fetch')) {
        return {
          error:
            'No se pudo conectar con el servidor. Arranca el API: npm run dev:cv o npm run dev:all.',
        };
      }
      const msg = e instanceof Error ? e.message : 'Error de red';
      return { error: msg };
    }
  };

  const signOut = async () => {
    setStoredToken(null);
    setUser(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        roles,
        signIn,
        signUp,
        signOut,
        isHR: roles.includes('hr') || roles.includes('admin'),
        isAdmin: roles.includes('admin'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
