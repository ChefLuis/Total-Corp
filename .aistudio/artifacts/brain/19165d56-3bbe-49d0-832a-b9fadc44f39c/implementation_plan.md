# Total Corp — Plano de Implementação (Etapa 1: Fundação, Design System, i18n e RBAC)

SaaS multiempresa de gestão, agendamento online, comanda, financeiro e marketing para negócios de beleza e bem-estar (spas, clínicas de estética, salões e barbearias). A Etapa 1 estabelece o esqueleto do projeto com design system original (tema Teal `#0F766E`), internacionalização completa (pt-BR, en, es), controle de acesso por papel (RBAC com 6 papéis) e modelo de dados multi-tenant com isolamento estrito por `company_id`.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisões Centrais da Etapa 1**:
> 1. **Design System & Identidade Visual**: Tema principal Teal (`#0F766E`), superfícies neutras ardósia/slate, tipografia contemporânea (`Plus Jakarta Sans` e numerais tabulares `tabular-nums`), sem cópia de concorrentes.
> 2. **Internacionalização (i18n)**: Suporte imediato a Português (Brasil), Inglês e Espanhol. Seletor de bandeiras (🇧🇷 🇺🇸 🇪🇸) fixado no topo em todas as telas, com persistência em `localStorage`.
> 3. **Camada de Permissões (RBAC)**: 6 papéis funcionais (`super_admin`, `owner`, `manager`, `receptionist`, `professional`, `financial`), matriz de permissões auditável e switcher interativo para testes de visão no topo da interface durante o desenvolvimento.
> 4. **Isolamento Multiempresa**: Toda entidade possuirá a chave estrangeira obrigatória `company_id`, com suporte a múltiplas filiais (`units`) por empresa.

---

## 1. Overview & Core Concept

- **O que entrega**: A plataforma inicial totalmente funcional com tela de autenticação/onboarding, navegação principal com controle de permissões por papel, seletor de idioma instantâneo, visualizador de permissões ativas e esqueleto preparado para acolher os 18 módulos funcionais subsequentes.
- **Público-alvo**: Gestores (`owner`), gerentes (`manager`), recepcionistas (`receptionist`), profissionais executores (`professional`), analistas financeiros (`financial`) e super administradores do SaaS (`super_admin`).
- **Valor Principal**: Interface limpa, ágil e livre de distrações, com feedback visual em menos de 150ms e alternância em tempo real entre unidades e papéis.

---

## 2. User Experience & Visual Design

### Paleta de Cores e Tokens
- **Cor Primária**: Teal Deep (`#0F766E` / `hsl(175, 84%, 26%)`)
- **Cor Primária Hover**: Teal Dark (`#115E59`)
- **Superfície Base**: White (`#FFFFFF`) e Slate-50 (`#F8FAFC`)
- **Bordas Estruturais**: Slate-200 (`#E2E8F0`)
- **Tipografia Principal**: `Plus Jakarta Sans`, 400 e 600
- **Dados & Métricas**: `tabular-nums` / `font-mono` para alinhamento contábil e de horários

### Layout e Navegação
- **Barra Superior (Top Bar Contract)**:
  - Esquerda: Logo Total Corp + Seletor de Unidade ativa da empresa.
  - Centro: Barra de busca global rápida (`Cmd+K`).
  - Direita: Seletor de bandeiras (🇧🇷, 🇺🇸, 🇪🇸) + Seletor/Badge de Papel ativo (RBAC) + Perfil com avatar e botão de logout.
- **Barra Lateral (Sidebar)**:
  - Navegação recolhível por grupos (Operacional, Administrativo, Configurações).
  - Itens filtrados condicionalmente de acordo com as permissões do usuário logado (ex.: profissional não visualiza menus financeiros nem relatórios de faturamento).

---

## 3. Key Product Decisions & Trade-Offs

- **Estratégia de Internacionalização**:
  - `i18next` com detecção de idioma e dicionários modulares (`pt-BR.json`, `en.json`, `es.json`).
  - Zero strings hardcoded no front-end: botões, títulos, alertas e status sempre traduzidos via hook `useTranslation()`.
- **Estratégia de Permissões (RBAC)**:
  - Matriz de políticas com checagens granulares (ex.: `appointments:read`, `appointments:write`, `financial:read`, `commissions:view_own`).
  - Componente `<RequirePermission permission="..." />` para proteger rotas e botões no cliente, garantindo que o usuário recepcionista não veja atalhos de exclusão ou dados financeiros restritos.
- **PWA & Offline Capability**:
  - Manifesto `manifest.json` e Service Worker configurados para instalação em desktop e dispositivos móveis (app do profissional).

---

## 4. Technical Architecture & Data Strategy

### Arquitetura de Componentes da Etapa 1

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App Provider Tree                             │
│  [QueryClientProvider] ── [I18nProvider] ── [AuthProvider / RBAC]      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        Top Bar & Global Layout                         │
│  [Company/Unit Selector] │ [Search Cmd+K] │ [Flags 🇧🇷🇺🇸🇪🇸] │ [Role Bar] │
├───────────────────────────────┬────────────────────────────────────────┤
│     Sidebar (RBAC-Filtered)   │         Main Content Viewport          │
│  • Dashboard                  │  • Tela de Boas-Vindas & Onboarding    │
│  • Agenda (bloqueada p/ fin)  │  • Matriz de Auditoria de Permissões   │
│  • Clientes                   │  • Visão Geral de Unidades             │
│  • Serviços                   │  • Configurações da Empresa            │
│  • Financeiro (restrito)      │  • Perfil do Usuário e Idioma          │
└───────────────────────────────┴────────────────────────────────────────┘
```

### Modelo de Dados Completo (PostgreSQL / Supabase com RLS)

```sql
-- 1. Empresas (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    document VARCHAR(20) NOT NULL, -- CNPJ/CPF
    slug VARCHAR(100) UNIQUE NOT NULL,
    segment VARCHAR(50) NOT NULL DEFAULT 'spa_wellness', -- spa_wellness, salon, barbershop, aesthetics, clinic
    theme_color VARCHAR(7) NOT NULL DEFAULT '#0F766E',
    logo_url TEXT,
    phone VARCHAR(30),
    email VARCHAR(255) NOT NULL,
    subscription_status VARCHAR(30) NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, suspended, canceled
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 2. Unidades (Filiais)
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address_street VARCHAR(255),
    address_number VARCHAR(50),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(20),
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Perfis de Usuários (RBAC)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    auth_user_id UUID, -- Referência ao Supabase Auth
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- super_admin, owner, manager, receptionist, professional, financial
    phone VARCHAR(30),
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Permissões Granulares por Papel
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL, -- appointments, clients, financial, commissions, team, settings
    action VARCHAR(50) NOT NULL,   -- create, read, update, delete, view_all, view_own
    allowed BOOLEAN NOT NULL DEFAULT TRUE
);

-- 5. Profissionais (Membros da Equipe)
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_profile_id UUID REFERENCES user_profiles(id),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    color_tag VARCHAR(7) DEFAULT '#0F766E',
    commission_rate NUMERIC(5, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Categorias e Serviços
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#0F766E',
    sort_order INT DEFAULT 0
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    buffer_time_minutes INT NOT NULL DEFAULT 10,
    price_cents INT NOT NULL DEFAULT 0, -- Armazenado em centavos
    is_online_bookable BOOLEAN NOT NULL DEFAULT TRUE,
    requires_deposit BOOLEAN NOT NULL DEFAULT FALSE,
    deposit_amount_cents INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Clientes (CRM)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30) NOT NULL,
    document VARCHAR(20),
    birth_date DATE,
    notes TEXT,
    lgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
    lgpd_consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Agendamentos
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    professional_id UUID NOT NULL REFERENCES professionals(id),
    service_id UUID NOT NULL REFERENCES services(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, arrived, in_service, completed, canceled, no_show
    notes TEXT,
    hold_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Isolamento RLS (Row Level Security)

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Política de isolamento estrito: usuários só acessam dados de sua própria company_id
CREATE POLICY company_isolation_policy ON units
    FOR ALL
    USING (company_id = (current_setting('app.current_company_id', true))::uuid);

CREATE POLICY company_isolation_policy_appointments ON appointments
    FOR ALL
    USING (company_id = (current_setting('app.current_company_id', true))::uuid);
```

---

## 5. Estrutura de Arquivos da Etapa 1

```
src/
├── assets/
│   └── brand/               # Logotipos e ícones vetoriais originais
├── components/
│   ├── common/              # Botões, Badges, Modais, Tooltips acessíveis
│   ├── layout/
│   │   ├── AppLayout.tsx    # Shell com Sidebar + Top Bar integrada
│   │   ├── Header.tsx       # Barra superior (bandeiras 🇧🇷🇺🇸🇪🇸, busca, perfil, unidade)
│   │   ├── Sidebar.tsx      # Barra de navegação com filtro RBAC
│   │   └── RoleSwitcher.tsx # Ferramenta de auditoria e teste de papéis no topo
│   └── ui/                  # Componentes do design system Teal
├── context/
│   ├── AuthContext.tsx      # Estado de sessão, usuário e empresa ativa
│   └── RBACContext.tsx       # Checador de permissões (hasPermission, canAccess)
├── i18n/
│   ├── index.ts             # Configuração do i18next e persistência
│   └── locales/
│       ├── pt-BR.json       # Traduções completas em Português
│       ├── en.json          # Traduções completas em Inglês
│       └── es.json          # Traduções completas em Espanhol
├── pages/
│   ├── auth/
│   │   ├── Login.tsx        # Login com seleção de credenciais de teste
│   │   └── Onboarding.tsx   # Assistente de criação de empresa e segmento
│   ├── dashboard/
│   │   └── Dashboard.tsx    # Painel principal operacional com métricas e atalhos
│   └── settings/
│       └── Permissions.tsx  # Matriz interativa de auditoria de permissões (RBAC)
├── services/
│   ├── mockData.ts          # Dados mock iniciais estruturados para Naturo SPA
│   └── api.ts               # Camada de comunicação
├── types/
│   ├── index.ts             # Tipos TypeScript para todas as entidades
│   └── rbac.ts              # Definições de papéis e permissões
└── utils/
    ├── currency.ts          # Formatação BRL / Centavos
    └── date.ts              # Manipulação UTC e fuso America/Sao_Paulo
```

---

## 6. Verificação e Próximos Passos

1. **Construção do Esqueleto da Etapa 1**:
   - Criação da infraestrutura de `i18n` com arquivos de idioma e seletor de bandeiras no topo.
   - Implementação do `AuthContext` e do `RBACContext` com suporte aos 6 papéis.
   - Construção do layout base com tema Teal `#0F766E` e alternância responsiva de papéis.
   - Implementação da tela inicial com métricas, visualização de permissões e boas-vindas do tenant.
2. **Execução de Build**: Executar `compile_applet` para certificar que todas as tipagens e módulos funcionam perfeitamente sem erros.
