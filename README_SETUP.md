# SisEVS - Sistema de Gestão Completo para Espaço Vida Saudável (EVS)

Projeto clonado com 100% da estrutura, código-fonte, regras de negócio, cálculos, telas e schema do banco de dados PostgreSQL/Supabase.

---

## 🚀 Guia Rápido de Configuração

### 1. Configurar o Supabase (Banco de Dados)

1. Acesse o [Supabase](https://supabase.com) e crie um novo projeto.
2. No menu lateral do Supabase, vá em **SQL Editor**.
3. Abra o arquivo [`supabase/schema_completo.sql`](./supabase/schema_completo.sql) deste repositório, copie todo o seu conteúdo e cole no SQL Editor do Supabase.
4. Clique em **Run** para executar. Isso criará automaticamente:
   - Todas as tabelas (`clientes`, `produtos`, `pedidos`, `itens_pedido`, `caixa`, `estoque`, `financeiro`, `users_profiles`, `configuracoes_sistema`, etc.)
   - Tipos ENUM, triggers de atualização, funções PostgreSQL e regras de segurança (RLS - Row Level Security).
5. Vá em **Project Settings** > **API** no Supabase e copie:
   - **Project URL**
   - **anon / public key**

---

### 2. Configurar as Variáveis de Ambiente Locais

1. Crie ou edite o arquivo `.env` na raiz do projeto com as credenciais do seu Supabase:

```env
VITE_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="SUA_CHAVE_ANON_AQUI"
VITE_SUPABASE_PROJECT_ID="SEU_ID_DO_PROJETO"

SUPABASE_URL="https://SEU_PROJETO.supabase.co"
SUPABASE_PUBLISHABLE_KEY="SUA_CHAVE_ANON_AQUI"
SUPABASE_PROJECT_ID="SEU_ID_DO_PROJETO"
```

---

### 3. Executar o Projeto Localmente

No terminal, execute:

```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```

Abra no navegador em `http://localhost:5173` (ou a porta indicada no terminal).

---

### 4. Publicar na Vercel

1. Suba este projeto para o seu GitHub pessoal ou da sua organização.
2. Acesse a [Vercel](https://vercel.com) e clique em **Add New...** > **Project**.
3. Importe o repositório do GitHub.
4. Na seção **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = sua chave anon do Supabase
   - `VITE_SUPABASE_PROJECT_ID` = id do projeto Supabase
   - `SUPABASE_URL` = sua URL do Supabase
   - `SUPABASE_PUBLISHABLE_KEY` = sua chave anon do Supabase
5. Clique em **Deploy**.

---

## 📂 Estrutura das Funcionalidades

- **Dashboard / Início**: Visão geral de vendas do dia, pedidos e métricas do EVS.
- **Pedidos**: Criação de pedidos com personalizações, controle de itens, copos/shakes, descontos e formas de pagamento (PIX, Dinheiro, Débito, Crédito).
- **Cozinha**: Painel de preparo (Kanban/Fila) em tempo real para produção rápida.
- **Caixa**: Abertura, fechamento, conferência e movimentações de caixa.
- **Estoque**: Controle de insumos, entradas, saídas, perdas e alertas de estoque mínimo.
- **Composição**: Ficha técnica e cálculo de custo/insumos por produto.
- **Meu Slim**: Gestão de clientes e programas especiais/kits.
- **Financeiro & Relatórios**: DRE, extrato financeiro, relatórios detalhados de faturamento, margem e histórico.
- **Auditoria & Configurações**: Log de eventos, gerenciamento de equipe e parâmetros do sistema.
