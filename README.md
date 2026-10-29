# Total Corp — Plataforma SaaS Multiempresa de Gestão, Agendamento e B2B

SaaS multi-tenant para gestão, agendamento online, vendas, PDV/comandas, controle financeiro com DRE, comissões, estoque por ficha técnica, módulo corporativo B2B e automação via WhatsApp para negócios de serviços (spas, clínicas de estética, salões de beleza, barbearias e centros de bem-estar).

Negócio piloto modelado: **Naturo SPA & Terapias Integrativas** (Complexo The Five / NH Curitiba The Five).

---

## 🌟 Funcionalidades Principais Implementadas

### 1. Multiempresa (Multi-Tenant) & RBAC Granular
- Isolamento total por `company_id` em todas as tabelas e modelos de domínio.
- Suporte a múltiplas filiais/unidades (ex: *The Five - Batel* e *Batel Soho*).
- 6 papéis com permissões granulares:
  - `super_admin`: Administrador global da plataforma Total Corp.
  - `owner`: Proprietário do negócio (acesso irrestrito e configurações).
  - `manager`: Gerente da unidade (operações, agenda, estoque e equipe).
  - `receptionist`: Recepção (agenda, comandas/PDV, cadastro e chat WhatsApp sem acesso financeiro/comissões).
  - `professional`: Terapeuta / Profissional parceiro (visão estrita da própria agenda e comissões individuais).
  - `financial`: Controladoria e contas a pagar/receber.
- Simulador interativo de papéis e unidades na barra superior com seletor de idiomas (🇧🇷 PT, 🇺🇸 EN, 🇪🇸 ES) persistido no `localStorage`.

### 2. Agenda Multivisão & Lista de Espera
- Visões por Dia, Semana, Mês e Profissional.
- Criação e gestão de agendamentos com status coloridos (`scheduled`, `confirmed`, `arrived`, `in_service`, `completed`, `no_show`, `cancelled`).
- Bloqueios operacionais (almoço, folga, manutenção de salas).
- Lista de espera automática integrada.

### 3. Cardápio Digital de Pedidos & Experiências (`menu.naturospa.com.br`)
- Rota dedicada e isolada: `/menu` e `/:slug/menu`.
- Exibição de massagens autorais, rituais de day spa, terapias focais e amenities/bebidas.
- Bolsa de pedidos para room service / amenities durante o atendimento no spa.
- Botão de reserva direta conectado ao agendamento público (`/:slug`).

### 4. Caixa, PDV & Comandas (Tabs)
- Abertura de turno de caixa com valor inicial, sangrias e suprimentos.
- Abertura de comandas por cliente com múltiplos serviços e produtos.
- Pagamento misto (divisão entre Pix, Cartão de Crédito em parcelas, Débito e Dinheiro) com cálculo automático de troco.
- Emissão de QR Code Pix dinâmico e recibo imprimível.

### 5. Módulo Financeiro & DRE Gerencial
- **Demonstração do Resultado do Exercício (DRE)** em tempo real:
  - Receita Bruta (serviços, produtos balcão e clubes)
  - (-) Deduções (taxas de cartão de 2.4% e Simples Nacional de 6%)
  - (=) Receita Operacional Líquida
  - (-) Custos Variáveis Diretos (comissões e insumos)
  - (=) Margem de Contribuição
  - (-) Despesas Fixas (aluguel/condomínio The Five, energia, sistemas)
  - (=) EBITDA / Lucro Operacional
- **Contas a Pagar & Receber**: status pendente, pago, vencido, liquidação com débito em contas bancárias cadastradas (Itaú e Inter PJ) e cobrança via Pix Copia e Cola.

### 6. Comissões & Fechamento de Folha (Lei do Salão-Parceiro)
- Regras personalizáveis por profissional (% serviços e % produtos).
- Dedução automática de taxas de maquininha de cartão e kits de insumos descartáveis.
- Gestão de vales e adiantamentos com abatimento automático no fechamento.
- Fechamento quinzenal/mensal com liquidação via Pix e recibo individual formal para impressão.

### 7. Estoque & Ficha Técnica de Serviços
- Separação entre **Insumos de Consumo Interno** (óleos essenciais, lençóis TNT, argilas) e **Produtos de Revenda** (velas aromáticas, home sprays, óleos fracionados).
- Fichas técnicas com baixa automática de estoque por atendimento concluído.
- Alertas de estoque mínimo e reposição.
- Registro de entradas com NF-e e custo unitário.

### 8. Módulo Corporativo B2B (Diferencial Competitivo)
- Gestão de convênios com empresas e condomínios parceiros (*Hotel NH The Five*, *Condomínio The Five*, *Vanguarda Tech*).
- Regras de subsídio empresarial (ex: 100% faturado, 50% subsídio com coparticipação, ou desconto em folha).
- Cadastro de beneficiários elegíveis (hóspedes de suítes, moradores ou colaboradores).
- Faturas B2B consolidadas com linha digitável e discriminação detalhada por atendido.
- Gestão de visitas *in-company* e Quick Massage corporativa.

### 9. Clubes de Assinatura & Recorrência B2C
- Planos de fidelização recorrente (*Clube Essência Relax*, *Clube Day Spa Premium*, *Clube Terapêutico*).
- Controle de créditos de sessões mensais com botão de resgate na recepção.
- Gestão da assinatura SaaS da plataforma (*Total Corp Pro*).

### 10. Central de Comunicação & WhatsApp
- Templates aprovados para confirmação imediata, lembretes automáticos (24h e 2h antes) e pesquisa pós-atendimento NPS.
- Simulador interativo de webhook para respostas do cliente (`1` para confirmar, `2` para remarcar, `PARAR` para opt-out LGPD).
- Chat bidirecional da recepção com o WhatsApp do cliente.

---

## 🛠️ Stack Tecnológica

- **Front-end**: React 19 + TypeScript + Vite + Tailwind CSS v4.
- **Roteamento**: React Router DOM v7.
- **Ícones & Design**: Lucide React + Plus Jakarta Sans + Tailwind Tokens.
- **Internacionalização (i18n)**: `i18next` + `react-i18next` com suporte a `pt-BR`, `en` e `es`.
- **Testes Unitários**: Vitest com 100% de aprovação (21 testes cobrindo todas as regras críticas).

---

## 🚀 Instalação e Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Rodar suite de testes automatizados
npm test -- --run

# 3. Rodar validação estática de tipos (TypeScript)
npm run lint

# 4. Iniciar servidor de desenvolvimento
npm run dev

# 5. Compilar para produção
npm run build
```

---

## 🔑 Variáveis de Ambiente (`.env.example`)

```env
# GEMINI_API_KEY: Chave para recursos de IA no servidor
GEMINI_API_KEY="SUA_CHAVE_AQUI"

# APP_URL: URL pública do applet
APP_URL="https://seu-dominio.com"

# Idioma e fuso padrão
VITE_DEFAULT_LOCALE="pt-BR"
VITE_TIMEZONE="America/Sao_Paulo"
```

---

## 🧪 Cobertura de Testes

Os testes unitários validam:
- `posEngine.test.ts`: Fechamento de comandas com pagamentos mistos, troco, conferência cega e sangria/suprimento de caixa.
- `calendarEngine.test.ts`: Criação de agendamentos, verificação de conflitos de horário e fila de espera.
- `whatsappEngine.test.ts`: Compilação de variáveis dinâmicas, disparos de lembretes e respostas com LGPD opt-out.
- `financialEngine.test.ts`: Cálculo da DRE Gerencial, contas a pagar/receber e geração de payload EMV Pix.
- `commissionsEngine.test.ts`: Cálculo de comissões, deduções de taxas de cartão e insumos, e quitação de folha.
- `inventoryEngine.test.ts`: Entradas de estoque com NF-e e baixa automática por consumo de fichas técnicas de serviços.
- `corporateEngine.test.ts`: Contratos de convênios corporativos B2B, validação de beneficiários e liquidação de faturas unificadas.
