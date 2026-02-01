# 🚀 Guia Completo de Deploy - Steam Ally

Este documento contém instruções detalhadas para fazer deploy do Steam Ally em produção, incluindo o backend com PostgreSQL e o frontend React.

---

## ✅ Checklist de Segurança (OBRIGATÓRIO)

Antes de fazer deploy, verifique cada item:

### Arquivos Sensíveis
- [ ] **`.env` NÃO está no Git** - Verifique que `.env` está no `.gitignore`
- [ ] **Nenhuma chave hardcoded** - Todas as chaves vêm de variáveis de ambiente
- [ ] **`server/.env` NÃO está no Git** - Backend também protegido

### Variáveis de Ambiente
- [ ] **JWT_SECRET** - Use uma chave aleatória de 32+ caracteres (NUNCA use o valor padrão)
- [ ] **STEAM_API_KEY** - Obtida em https://steamcommunity.com/dev/apikey
- [ ] **DATABASE_URL** - String de conexão com SSL habilitado (`?sslmode=require`)
- [ ] **NODE_ENV=production** - Nunca deixe em development

### Banco de Dados
- [ ] **Senha forte** - Use uma senha gerada automaticamente pelo provedor
- [ ] **SSL obrigatório** - Conexões devem ser criptografadas
- [ ] **Backup configurado** - Habilite backup automático no provedor

### URLs e CORS
- [ ] **FRONTEND_URL** - Domínio exato do frontend (sem trailing slash)
- [ ] **STEAM_RETURN_URL** - URL completa do callback de autenticação
- [ ] **COOKIE_DOMAIN** - Domínio correto para cookies de sessão

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Pré-requisitos](#pré-requisitos)
3. [Variáveis de Ambiente](#variáveis-de-ambiente)
4. [Banco de Dados PostgreSQL](#banco-de-dados-postgresql)
5. [Deploy do Backend](#deploy-do-backend)
6. [Deploy do Frontend](#deploy-do-frontend)
7. [Configuração de CORS e Cookies](#configuração-de-cors-e-cookies)
8. [Verificação Pós-Deploy](#verificação-pós-deploy)
9. [Backup e Manutenção](#backup-e-manutenção)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (Vercel)      │     │ (Railway/Render)│     │   (Neon/Supabase)│
│   React + Vite  │     │ Express + Node  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        └──────────────▶│   Steam API     │
                        │   (OpenID)      │
                        └─────────────────┘
```

---

## 📋 Pré-requisitos

### Contas Necessárias
- [GitHub](https://github.com) - Repositório de código
- [Vercel](https://vercel.com) - Deploy do frontend
- [Railway](https://railway.app), [Render](https://render.com) ou [Fly.io](https://fly.io) - Deploy do backend
- [Neon](https://neon.tech), [Supabase](https://supabase.com) ou [Railway PostgreSQL](https://railway.app) - Banco de dados
- [Steam Developer](https://steamcommunity.com/dev/apikey) - API Key

### Ferramentas Locais
- Node.js 18+ 
- npm ou yarn
- Git
- PostgreSQL (para desenvolvimento local)

---

## 🔐 Variáveis de Ambiente

### Backend (`server/.env`)

```env
# Servidor
PORT=3001
NODE_ENV=production

# Banco de Dados (obrigatório)
DATABASE_URL=postgresql://usuario:senha@host:5432/steam_ally?sslmode=require

# JWT (obrigatório - gere uma chave segura)
JWT_SECRET=sua-chave-jwt-super-secreta-minimo-32-caracteres
JWT_EXPIRES_IN=7d

# Steam API (obrigatório)
STEAM_API_KEY=sua-steam-api-key-aqui

# URLs (ajuste para seu domínio)
FRONTEND_URL=https://seu-frontend.vercel.app
STEAM_REALM=https://seu-frontend.vercel.app
STEAM_RETURN_URL=https://seu-backend.railway.app/auth/steam/callback

# Cookie (ajuste para produção)
COOKIE_DOMAIN=seu-frontend.vercel.app
```

### Frontend (`.env.production`)

```env
VITE_API_URL=https://seu-backend.railway.app
VITE_STEAM_API_KEY=sua-steam-api-key-aqui
```

### Gerando JWT_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🗄️ Banco de Dados PostgreSQL

### Opção 1: Neon (Recomendado - Gratuito)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto
3. Copie a connection string (formato: `postgresql://...`)
4. A string já inclui SSL por padrão

### Opção 2: Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **Settings > Database**
3. Copie a **Connection string** (URI)
4. Adicione `?sslmode=require` ao final

### Opção 3: Railway PostgreSQL

1. No Railway, adicione um novo serviço PostgreSQL
2. Copie a variável `DATABASE_URL` do serviço

### Criação das Tabelas (Migrations)

Após configurar o banco, execute as migrations:

```bash
cd server
npm install
npm run migrate:dev
```

Ou execute manualmente no cliente SQL:

```sql
-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  steam_id VARCHAR(20) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);

-- Tabela de guias
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  steam_app_id INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guides_author ON guides(author_id);
CREATE INDEX IF NOT EXISTS idx_guides_app_id ON guides(steam_app_id);
CREATE INDEX IF NOT EXISTS idx_guides_public ON guides(is_public) WHERE is_public = true;

-- Tabela de guias salvos (relação N:N)
CREATE TABLE IF NOT EXISTS saved_guides (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_guides_user ON saved_guides(user_id);

-- Tabela de likes em guias (relação N:N)
CREATE TABLE IF NOT EXISTS guide_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_guide_likes_guide ON guide_likes(guide_id);

-- Tabela de controle de migrations
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🖥️ Deploy do Backend

### Opção 1: Railway (Recomendado)

1. **Conectar Repositório**
   ```
   railway.app → New Project → Deploy from GitHub repo
   ```

2. **Configurar Serviço**
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Adicionar Variáveis de Ambiente**
   - Vá em **Variables** e adicione todas as variáveis do `.env`

4. **Gerar Domínio**
   - Vá em **Settings > Networking > Generate Domain**
   - Anote a URL (ex: `steam-ally-api.up.railway.app`)

### Opção 2: Render

1. **Criar Web Service**
   ```
   render.com → New → Web Service → Connect repo
   ```

2. **Configurar**
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node

3. **Adicionar Environment Variables**
   - Mesmas variáveis do Railway

### Opção 3: Fly.io

1. **Instalar CLI e fazer login**
   ```bash
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   
   # Login
   fly auth login
   ```

2. **Criar e deployar app**
   ```bash
   cd server
   fly launch
   fly secrets set DATABASE_URL="postgresql://..." JWT_SECRET="..." STEAM_API_KEY="..."
   fly deploy
   ```

### Build Manual

```bash
cd server
npm install
npm run build
npm start
```

---

## 🌐 Deploy do Frontend

### Vercel (Recomendado)

1. **Importar Projeto**
   ```
   vercel.com → Add New → Project → Import Git Repository
   ```

2. **Configurar Build**
   - Framework Preset: Vite
   - Root Directory: `.` (raiz)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Adicionar Variáveis de Ambiente**
   ```
   VITE_API_URL=https://seu-backend.railway.app
   VITE_STEAM_API_KEY=sua-steam-api-key
   ```

4. **Deploy**
   - Clique em **Deploy**
   - Anote a URL gerada (ex: `steam-ally.vercel.app`)

### Deploy via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login e deploy
vercel login
vercel

# Deploy para produção
vercel --prod
```

---

## 🔒 Configuração de CORS e Cookies

### Problema Comum: Cookies não funcionam em produção

Isso acontece porque navegadores modernos bloqueiam cookies de terceiros. Para resolver:

1. **Backend - Configure CORS corretamente**:
   ```typescript
   // server/src/index.ts
   app.use(cors({
     origin: 'https://seu-frontend.vercel.app',
     credentials: true,
   }));
   ```

2. **Backend - Configure cookies para SameSite=None**:
   ```typescript
   res.cookie('auth_token', token, {
     httpOnly: true,
     secure: true,        // HTTPS obrigatório
     sameSite: 'none',    // Permite cross-site
     maxAge: 7 * 24 * 60 * 60 * 1000,
   });
   ```

3. **Variáveis de ambiente corretas**:
   ```env
   FRONTEND_URL=https://steam-ally.vercel.app
   COOKIE_DOMAIN=.vercel.app
   NODE_ENV=production
   ```

### Domínio Customizado (Opcional)

Para evitar problemas com cookies, considere usar um domínio customizado:

1. Compre um domínio (ex: `steamally.com`)
2. Configure o frontend em `steamally.com`
3. Configure o backend em `api.steamally.com`
4. Ambos compartilham o mesmo domínio pai, facilitando cookies

---

## ✅ Verificação Pós-Deploy

### 1. Verificar Health Check do Backend

```bash
curl https://seu-backend.railway.app/health
# Deve retornar: {"success":true,"message":"Steam Ally API is running",...}
```

### 2. Verificar Conexão com Banco

```bash
curl https://seu-backend.railway.app/api/guides
# Deve retornar: {"success":true,"data":[],...}
```

### 3. Testar Autenticação Steam

1. Acesse seu frontend: `https://steam-ally.vercel.app`
2. Clique em "Entrar com Steam"
3. Faça login na Steam
4. Verifique se foi redirecionado corretamente

### 4. Verificar Logs

**Railway:**
```bash
railway logs
```

**Render:**
- Acesse o dashboard → seu serviço → Logs

**Vercel:**
```bash
vercel logs
```

---

## 💾 Backup e Manutenção

### Backup do Banco de Dados

#### Neon / Supabase
- Backups automáticos incluídos no plano gratuito
- Acesse o dashboard para restaurar

#### Manual com pg_dump

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restaurar
psql $DATABASE_URL < backup_20250201.sql
```

### Script de Backup Automatizado

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/steam_ally_$DATE.sql.gz"

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Monitoramento

Recomendamos configurar:
- **Uptime monitoring**: [UptimeRobot](https://uptimerobot.com) (gratuito)
- **Error tracking**: [Sentry](https://sentry.io) (gratuito para projetos pequenos)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)

---

## 🔧 Troubleshooting

### Erro: "Cannot connect to database"

```
Verifique:
1. DATABASE_URL está correta
2. IP do servidor está na whitelist do banco (se aplicável)
3. SSL está habilitado (?sslmode=require)
```

### Erro: "CORS policy blocked"

```
Verifique:
1. FRONTEND_URL no backend está correto
2. Sem barra final na URL (https://site.com, não https://site.com/)
3. credentials: true está configurado
```

### Erro: "Cookie not being set"

```
Verifique:
1. HTTPS está habilitado (secure: true)
2. SameSite está configurado corretamente
3. Domínio do cookie está correto
```

### Erro: "Steam OpenID authentication failed"

```
Verifique:
1. STEAM_API_KEY está correta
2. STEAM_REALM aponta para o frontend
3. STEAM_RETURN_URL aponta para o backend/auth/steam/callback
```

### Erro: "Build failed on Vercel"

```
Verifique:
1. Todas as dependências estão no package.json
2. Não há imports de arquivos que não existem
3. TypeScript está compilando sem erros (npm run build local)
```

---

## 📚 Comandos Úteis

### Desenvolvimento Local

```bash
# Backend
cd server
cp .env.example .env  # Configure as variáveis
npm install
npm run dev

# Frontend (outro terminal)
npm install
npm run dev
```

### Produção

```bash
# Build do backend
cd server
npm run build
npm start

# Build do frontend
npm run build
npm run preview  # Preview local do build
```

### Database

```bash
# Rodar migrations
cd server
npm run migrate:dev

# Conectar ao banco (psql)
psql $DATABASE_URL
```

---

## 🎯 Checklist de Deploy

- [ ] Banco PostgreSQL criado e configurado
- [ ] Migrations executadas
- [ ] Backend deployado
- [ ] Variáveis de ambiente do backend configuradas
- [ ] Health check do backend funcionando
- [ ] Frontend deployado
- [ ] Variáveis de ambiente do frontend configuradas
- [ ] CORS configurado corretamente
- [ ] Login com Steam funcionando
- [ ] Criação de guias funcionando
- [ ] Like/Save de guias funcionando
- [ ] Backup automatizado configurado
- [ ] Monitoramento configurado

---

## 🔄 Atualizações Futuras

Sempre que você fizer mudanças:

```bash
# Faça suas alterações no código...

# Commit
git add .
git commit -m "Descrição das mudanças"

# Push para o GitHub
git push

# Vercel fará deploy automático do frontend
# Railway/Render fará deploy automático do backend
```

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do serviço
2. Consulte a seção de Troubleshooting
3. Verifique se todas as variáveis de ambiente estão corretas
4. Teste localmente para isolar o problema

---

*Última atualização: Fevereiro 2026*
