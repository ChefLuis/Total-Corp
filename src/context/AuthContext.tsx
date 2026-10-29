import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, Unit, UserProfile, AppRole } from '../types';
import { INITIAL_COMPANIES, INITIAL_UNITS, INITIAL_USERS } from '../services/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile;
  currentCompany: Company;
  units: Unit[];
  activeUnit: Unit | null;
  companies: Company[];
  setActiveRole: (role: AppRole) => void;
  setActiveCompany: (companyId: string) => void;
  setActiveUnit: (unit: Unit | null) => void;
  updateCompany: (updates: Partial<Company>) => void;
  loginAsUser: (userId: string) => void;
  /** 'demo' = dados locais de exemplo · 'supabase' = login e banco reais */
  mode: 'demo' | 'supabase';
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'needs_company';
  signOut: () => Promise<void>;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DemoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('totalcorp_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });

  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() => {
    return localStorage.getItem('totalcorp_current_company_id') || INITIAL_COMPANIES[0].id;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('totalcorp_current_user_id') || INITIAL_USERS[1].id; // Default to owner
  });

  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

  const currentCompany = companies.find((c) => c.id === currentCompanyId) || companies[0];

  // Isolated units belonging strictly to currentCompany
  const companyUnits = INITIAL_UNITS.filter((u) => u.company_id === currentCompany.id);
  const activeUnit = activeUnitId ? companyUnits.find((u) => u.id === activeUnitId) || null : null;

  const initialUser = INITIAL_USERS.find((u) => u.id === currentUserId) || INITIAL_USERS[1];
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);

  useEffect(() => {
    localStorage.setItem('totalcorp_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('totalcorp_current_company_id', currentCompanyId);
  }, [currentCompanyId]);

  useEffect(() => {
    localStorage.setItem('totalcorp_current_user_id', currentUser.id);
  }, [currentUser]);

  const setActiveRole = (role: AppRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      full_name: `${prev.full_name.split(' (')[0]} (${role})`,
    }));
  };

  const setActiveCompany = (companyId: string) => {
    setCurrentCompanyId(companyId);
    setActiveUnitId(null);
  };

  const setActiveUnit = (unit: Unit | null) => {
    setActiveUnitId(unit ? unit.id : null);
  };

  const updateCompany = (updates: Partial<Company>) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === currentCompany.id ? { ...c, ...updates } : c))
    );
  };

  const loginAsUser = (userId: string) => {
    const user = INITIAL_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setCurrentCompanyId(user.company_id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCompany,
        units: companyUnits,
        activeUnit,
        companies,
        setActiveRole,
        setActiveCompany,
        setActiveUnit,
        updateCompany,
        loginAsUser,
        mode: 'demo',
        status: 'authenticated',
        signOut: async () => {},
        refreshAccount: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const GUEST_USER: UserProfile = {
  id: 'guest', company_id: 'guest', email: '', full_name: 'Visitante', role: 'professional', is_active: true,
};
const GUEST_COMPANY: Company = {
  id: 'guest', name: 'Total Corp', trade_name: 'Total Corp', document: '', slug: 'guest', segment: 'spa_wellness',
  theme_color: '#0F766E', phone: '', email: '', subscription_status: 'trialing', trial_ends_at: '', created_at: '',
};

const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthContextType['status']>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

  const loadAccount = React.useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null); setCompany(null); setUnits([]); setStatus('unauthenticated');
      return;
    }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!p) {
      setProfile(null); setCompany(null); setUnits([]); setStatus('needs_company');
      return;
    }
    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from('companies').select('*').eq('id', p.company_id).maybeSingle(),
      supabase.from('units').select('*').eq('company_id', p.company_id).order('created_at'),
    ]);
    if (!c) { setStatus('needs_company'); return; }
    setProfile({ ...(p as UserProfile), role: p.role as AppRole });
    setCompany(c as Company);
    setUnits((u || []) as Unit[]);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) loadAccount(data.session?.user.id ?? null); });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      // adia um tick: evita chamar o banco dentro do callback de autenticação
      setTimeout(() => { if (alive) loadAccount(session?.user.id ?? null); }, 0);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [loadAccount]);

  const activeUnit = activeUnitId ? units.find((x) => x.id === activeUnitId) || null : null;

  const value: AuthContextType = {
    currentUser: profile || GUEST_USER,
    currentCompany: company || GUEST_COMPANY,
    units,
    activeUnit,
    companies: company ? [company] : [],
    // O papel vem SEMPRE do banco; não existe simulação em modo real.
    setActiveRole: () => {},
    setActiveCompany: () => {},
    setActiveUnit: (unit) => setActiveUnitId(unit ? unit.id : null),
    updateCompany: (updates) => {
      if (!company) return;
      setCompany({ ...company, ...updates });
      const { name, trade_name, document, theme_color, logo_url, phone, email } = updates;
      supabase.from('companies').update({ name, trade_name, document, theme_color, logo_url, phone, email })
        .eq('id', company.id).then(() => {});
    },
    loginAsUser: () => {},
    mode: 'supabase',
    status,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshAccount: async () => {
      const { data } = await supabase.auth.getSession();
      await loadAccount(data.session?.user.id ?? null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  isSupabaseConfigured ? <SupabaseAuthProvider>{children}</SupabaseAuthProvider> : <DemoAuthProvider>{children}</DemoAuthProvider>;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
