import { ClubPlan, ClubSubscriber, SaaSPlatformSubscription } from './types';

export const INITIAL_CLUB_PLANS: ClubPlan[] = [
  {
    id: 'plan_relax_01',
    company_id: 'comp_naturo_spa_01',
    name: 'Clube Essência Relax',
    price_cents: 19900, // R$ 199/mês
    sessions_per_month: 1,
    discount_percentage: 15,
    description: '1 Massagem Relaxante ou Aromaterapia (60min) por mês + 15% de desconto em qualquer outro serviço adicional.',
    perks: [
      '1 sessão mensal inclusa',
      '15% OFF em tratamentos avulsos',
      'Prioridade na agenda aos sábados',
      'Chá aromático especial de boas-vindas'
    ],
    active: true,
  },
  {
    id: 'plan_premium_02',
    company_id: 'comp_naturo_spa_01',
    name: 'Clube Day Spa Premium',
    price_cents: 38900, // R$ 389/mês
    sessions_per_month: 2,
    discount_percentage: 20,
    description: '2 terapias corporais completas por mês + 20% de desconto e 1 voucher para acompanhante com 20% OFF.',
    perks: [
      '2 sessões mensais completas inclusas',
      '20% OFF em tratamentos e produtos de revenda',
      '1 voucher de acompanhante com 20% off',
      'Acesso à área de relaxamento com amenities exclusivas'
    ],
    active: true,
  },
  {
    id: 'plan_terapeutico_03',
    company_id: 'comp_naturo_spa_01',
    name: 'Clube Terapêutico Integrativo',
    price_cents: 54900, // R$ 549/mês
    sessions_per_month: 4,
    discount_percentage: 25,
    description: '4 sessões terapêuticas mensais (Shiatsu, Drenagem ou Pedras Quentes) com terapeuta sênior dedicado.',
    perks: [
      '4 sessões mensais (1 por semana)',
      'Acompanhamento e evolução terapêutica personalizada',
      '25% OFF em cosméticos e home care',
      'Remarcação sem carência'
    ],
    active: true,
  },
];

export const INITIAL_SUBSCRIBERS: ClubSubscriber[] = [
  {
    id: 'sub_001',
    company_id: 'comp_naturo_spa_01',
    client_id: 'cli_helena_01',
    client_name: 'Helena Ribeiro',
    client_phone: '(41) 99123-4567',
    plan_id: 'plan_relax_01',
    plan_name: 'Clube Essência Relax',
    price_cents: 19900,
    start_date: '2026-08-15',
    next_billing_date: '2026-11-15',
    credits_remaining: 1,
    status: 'active',
    card_last4: '4821',
  },
  {
    id: 'sub_002',
    company_id: 'comp_naturo_spa_01',
    client_id: 'cli_mariana_02',
    client_name: 'Mariana Duarte',
    client_phone: '(41) 98765-4321',
    plan_id: 'plan_premium_02',
    plan_name: 'Clube Day Spa Premium',
    price_cents: 38900,
    start_date: '2026-09-01',
    next_billing_date: '2026-11-01',
    credits_remaining: 2,
    status: 'active',
    card_last4: '9912',
  },
];

export const SAAS_PLATFORM_DATA: SaaSPlatformSubscription = {
  plan_name: 'Total Corp Pro',
  price_cents: 24900, // R$ 249/mês
  status: 'trial',
  trial_days_remaining: 7,
  next_charge_date: '2026-10-26',
  features: [
    'Multi-unidades ilimitadas',
    'Agenda com visões Dia/Semana/Mês e encaixes inteligentes',
    'Cardápio digital integrado com pedidos online',
    'Controle de Comandas e PDV com Pix QR Code dinâmico',
    'DRE Gerencial e Fluxo de Caixa em tempo real',
    'Comissões com dedução automática de taxas e kits',
    'Módulo Corporativo B2B com faturas unificadas',
    'Disparos WhatsApp oficiais com confirmação automática'
  ],
};

class SubscriptionsEngine {
  private plans: ClubPlan[] = [...INITIAL_CLUB_PLANS];
  private subscribers: ClubSubscriber[] = [...INITIAL_SUBSCRIBERS];

  public getPlans(companyId: string): ClubPlan[] {
    return this.plans.filter(p => p.company_id === companyId);
  }

  public getSubscribers(companyId: string): ClubSubscriber[] {
    return this.subscribers.filter(s => s.company_id === companyId);
  }

  public addPlan(plan: Omit<ClubPlan, 'id'>): ClubPlan {
    const newPlan: ClubPlan = {
      ...plan,
      id: `plan_${Date.now()}`,
    };
    this.plans.push(newPlan);
    return newPlan;
  }

  public addSubscriber(sub: Omit<ClubSubscriber, 'id'>): ClubSubscriber {
    const newSub: ClubSubscriber = {
      ...sub,
      id: `sub_${Date.now()}`,
    };
    this.subscribers.push(newSub);
    return newSub;
  }

  public useSessionCredit(subId: string): boolean {
    const sub = this.subscribers.find(s => s.id === subId);
    if (!sub || sub.credits_remaining <= 0) return false;
    sub.credits_remaining -= 1;
    return true;
  }
}

export const subscriptionsEngine = new SubscriptionsEngine();
