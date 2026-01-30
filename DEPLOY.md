# 🚀 Guia de Deploy - Steam Ally

## 📋 Pré-requisitos

1. Conta no GitHub
2. Conta na Vercel (pode fazer login com GitHub)
3. Steam API Key ([obtenha aqui](https://steamcommunity.com/dev/apikey))

## 🎯 Passo a Passo

### 1️⃣ Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Preencha os dados:
   - **Repository name**: `steam-ally` (ou outro nome de sua preferência)
   - **Description**: "Steam Achievement Tracker and Guide Creator"
   - Deixe como **Public** (necessário para Vercel gratuito)
   - ❌ **NÃO** marque "Add a README file" (já temos um)
   - ❌ **NÃO** adicione .gitignore (já temos)
   - ❌ **NÃO** escolha licença (já temos)
3. Clique em **"Create repository"**

### 2️⃣ Conectar seu Projeto Local ao GitHub

No terminal, execute:

```bash
# Adicione o repositório remoto (substitua SEU-USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU-USUARIO/steam-ally.git

# Envie o código para o GitHub
git push -u origin main
```

Se pedir autenticação:
- **Username**: seu username do GitHub
- **Password**: use um Personal Access Token (não sua senha)
  - Crie em: https://github.com/settings/tokens
  - Marque o scope `repo`

### 3️⃣ Deploy na Vercel

#### Opção A: Via Interface Web (Mais Fácil)

1. Acesse https://vercel.com
2. Faça login com sua conta GitHub
3. Clique em **"Add New..."** → **"Project"**
4. Selecione o repositório `steam-ally`
5. Configure o projeto:
   - **Framework Preset**: Vite (detectado automaticamente)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Em **Environment Variables**, adicione:
   ```
   Name: VITE_STEAM_API_KEY
   Value: [SUA_STEAM_API_KEY_AQUI]
   ```
7. Clique em **"Deploy"**
8. Aguarde 1-2 minutos ⏳
9. ✅ Pronto! Sua aplicação está no ar!

#### Opção B: Via CLI

```bash
# Instale a Vercel CLI
npm install -g vercel

# Faça login
vercel login

# Deploy
vercel

# Siga as instruções:
# - Link to existing project? No
# - Project name: steam-ally
# - In which directory is your code? ./
# - Detected Vite, continue? Yes
# - Override settings? No

# Configure a variável de ambiente
vercel env add VITE_STEAM_API_KEY

# Faça o deploy para produção
vercel --prod
```

### 4️⃣ Configurar Variáveis de Ambiente

Se você esqueceu de adicionar a API key durante o deploy:

1. Acesse o dashboard da Vercel
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione:
   - **Name**: `VITE_STEAM_API_KEY`
   - **Value**: Sua Steam API Key
   - **Environments**: Selecione Production, Preview e Development
5. Clique em **"Save"**
6. Faça um novo deploy (ou aguarde o próximo commit)

### 5️⃣ Domínio Personalizado (Opcional)

1. No dashboard do projeto na Vercel
2. Vá em **Settings** → **Domains**
3. Adicione seu domínio personalizado
4. Configure os DNS no seu provedor de domínio
5. Aguarde a propagação (pode levar até 48h)

## 🔄 Atualizações Futuras

Sempre que você fizer mudanças:

```bash
# Faça suas alterações no código...

# Commit
git add .
git commit -m "Descrição das mudanças"

# Push para o GitHub
git push

# A Vercel fará deploy automático! 🎉
```

## 🔍 Verificar Status do Deploy

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Logs em tempo real**: Clique no deploy → View Function Logs

## 🐛 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se adicionou `VITE_STEAM_API_KEY` nas variáveis de ambiente
- Confirme que a key está correta em https://steamcommunity.com/dev/apikey
- Faça um novo deploy após adicionar a variável

### Erro: "Build Failed"
- Verifique os logs de build na Vercel
- Execute `npm run build` localmente para testar
- Verifique se todas as dependências estão no package.json

### CORS Errors
- Normal! A Steam API tem limitações CORS
- Algumas funcionalidades podem precisar do perfil Steam público

## 📱 Compartilhar com Amigos

Após o deploy, você terá uma URL tipo:
```
https://steam-ally.vercel.app
```

Compartilhe essa URL com seus amigos! 🎮

## 💡 Dicas

1. **Domínio Grátis**: A Vercel fornece um domínio `*.vercel.app` gratuito
2. **HTTPS Automático**: Certificado SSL configurado automaticamente
3. **Deploy Instantâneo**: Cada push no GitHub gera um novo deploy
4. **Preview Deploys**: Pull requests geram URLs de preview
5. **Analytics**: Disponível no plano gratuito da Vercel

## 🔐 Segurança

⚠️ **NUNCA** commite arquivos `.env` com suas chaves!
- O `.gitignore` já está configurado para isso
- Use sempre as variáveis de ambiente da Vercel

## 📊 Monitoramento

A Vercel fornece gratuitamente:
- 📈 Analytics de uso
- 🚀 Performance metrics
- 📝 Logs de erro
- 👥 Estatísticas de visitantes

Acesse em: **Dashboard** → **Analytics**

## 🎉 Pronto!

Seu Steam Ally está no ar! 🚀

**URL padrão**: https://steam-ally-[seu-hash].vercel.app

---

Problemas? Abra uma issue no GitHub ou entre em contato!
