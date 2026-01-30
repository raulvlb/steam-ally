# 🚀 Quick Start Guide

## Setup Rápido (5 minutos)

### 1. Instalação

```bash
# Método 1: Script automatizado (recomendado)
./setup.sh

# Método 2: Manual
npm install
cp .env.example .env
```

### 2. Configurar Steam API Key

Edite o arquivo `.env`:

```env
VITE_STEAM_API_KEY=SUA_CHAVE_AQUI
```

**Obtenha sua chave em**: https://steamcommunity.com/dev/apikey

### 3. Iniciar Aplicação

```bash
# Método 1: Script
./start.sh

# Método 2: npm
npm run dev
```

Acesse: http://localhost:3000

## 🎯 Como Usar

### Buscar Perfil

1. Na home, digite um **Steam ID** ou **URL de perfil**
2. Exemplos:
   - Steam ID: `76561198012345678`
   - Vanity URL: `gabelogannewell`
   - URL completa: `https://steamcommunity.com/id/gabelogannewell`

### Visualizar Jogos

1. Após carregar um perfil, clique em "View All"
2. Use a busca para filtrar jogos
3. Ordene por nome ou tempo jogado
4. Navegue pelas páginas

### Ver Conquistas

1. Clique em qualquer jogo da biblioteca
2. Veja o progresso total
3. Filtre por desbloqueadas/bloqueadas
4. Busque conquistas específicas

## 🐛 Problemas Comuns

### API Key Inválida
**Problema**: Erro 401 Unauthorized  
**Solução**: Verifique se a chave no `.env` está correta

### Perfil Privado
**Problema**: Dados não carregam  
**Solução**: Use perfis públicos. Configure a privacidade no Steam

### Proxy em Produção
**Problema**: Não funciona em produção  
**Solução**: Configure um backend proxy ou use serviços como Vercel/Netlify com rewrites

## 📱 Atalhos do Teclado

- `Ctrl/Cmd + K` - Focar na busca
- `Escape` - Fechar modais
- `←/→` - Navegar paginação

## 🎨 Features

- ✅ Dark Mode (automático)
- ✅ Busca com debounce
- ✅ Cache inteligente
- ✅ Paginação
- ✅ Skeleton loaders
- ✅ Toast notifications
- ✅ Responsive design

## 🔧 Comandos Úteis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run preview  # Preview build
npm run lint     # Verificar erros
npm run format   # Formatar código
```

## 📚 Próximos Passos

1. Leia o [README.md](./README.md) completo
2. Explore a [Arquitetura](./docs/architecture.md)
3. Customize o tema em `tailwind.config.js`
4. Adicione novas features

## 💡 Dicas

- Use perfis públicos para testes
- O cache é limpo a cada 5 minutos
- Dark mode é persistido no localStorage
- Imagens são carregadas com lazy loading

## 🆘 Precisa de Ajuda?

- Veja exemplos no código
- Leia a documentação da [Steam API](https://partner.steamgames.com/doc/webapi)
- Abra uma issue no repositório

---

**Desenvolvido com ❤️ | Steam Ally**
