# 🎮 Steam Ally

> Uma aplicação web moderna e completa para explorar perfis, jogos e conquistas da Steam.

[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)

## 📋 Visão Geral

Steam Ally é uma aplicação web profissional que permite buscar jogos da Steam, consultar perfis públicos de usuários, visualizar progresso de conquistas e estatísticas de jogos utilizando as APIs públicas oficiais da Steam Web API.

### ✨ Características Principais

- 🔍 **Busca de Perfis**: Busque usuários por Steam ID ou vanity URL
- 🎮 **Biblioteca de Jogos**: Visualize todos os jogos de um usuário com filtros e paginação
- 🏆 **Sistema de Conquistas**: Acompanhe o progresso de conquistas de qualquer jogo
- 📊 **Estatísticas Detalhadas**: Veja horas jogadas, nível Steam, e muito mais
- 🌙 **Dark Mode**: Tema escuro/claro com persistência
- ⚡ **Performance**: Cache inteligente e lazy loading
- 📱 **Responsivo**: Interface adaptável para todos os dispositivos

## 🛠️ Stack Tecnológica

- **Frontend**: React 18.2 + TypeScript 5.3
- **Build Tool**: Vite 5.0
- **Styling**: TailwindCSS 3.4
- **State Management**: Zustand 4.5
- **Routing**: React Router DOM 6.22
- **HTTP Client**: Axios 1.6
- **Icons**: Lucide React
- **Code Quality**: ESLint + Prettier

## 🚀 Setup e Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Steam API Key ([obtenha aqui](https://steamcommunity.com/dev/apikey))

### Instalação Rápida

1. **Clone o repositório** (ou use o projeto atual):

```bash
git clone <repository-url>
cd platinador
```

2. **Execute o script de setup** (recomendado):

```bash
chmod +x setup.sh
./setup.sh
```

Ou instale manualmente:

```bash
npm install
```

3. **Configure as variáveis de ambiente**:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione sua Steam API Key:

```env
VITE_STEAM_API_KEY=sua_chave_api_aqui
```

> ⚠️ **IMPORTANTE**: Você precisa de uma Steam API Key válida. Obtenha em: https://steamcommunity.com/dev/apikey

> ℹ️ **DESENVOLVIMENTO**: O Vite está configurado com um proxy local para a Steam API, então não há problemas de CORS em desenvolvimento.

## 📜 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento (porta 3000)
npm run build    # Build para produção
npm run preview  # Preview do build de produção
npm run lint     # Executa ESLint
npm run format   # Formata código com Prettier
```

### Scripts Shell

```bash
./setup.sh       # Setup completo do projeto
./start.sh       # Inicia o servidor de desenvolvimento
```

## 📁 Estrutura do Projeto

```
src/
├── api/                    # Camada de API
│   └── steam.ts           # Cliente HTTP Steam API
├── components/            # Componentes reutilizáveis
│   ├── Card.tsx          # Componente de card
│   ├── GameCard.tsx      # Card de jogo
│   ├── Navbar.tsx        # Barra de navegação
│   ├── Pagination.tsx    # Componente de paginação
│   ├── ProgressBar.tsx   # Barra de progresso
│   ├── Skeleton.tsx      # Loading skeletons
│   ├── Toast.tsx         # Notificações toast
│   └── index.ts          # Exports centralizados
├── hooks/                 # Custom hooks
│   ├── useDebounce.ts    # Hook de debounce
│   ├── usePagination.ts  # Hook de paginação
│   ├── useSteamProfile.ts       # Hook de perfil
│   ├── useSteamGames.ts         # Hook de jogos
│   ├── useSteamAchievements.ts  # Hook de conquistas
│   └── index.ts
├── pages/                 # Páginas da aplicação
│   ├── HomePage.tsx      # Página inicial
│   ├── ProfilePage.tsx   # Página de perfil
│   ├── GamesPage.tsx     # Lista de jogos
│   ├── AchievementsPage.tsx  # Conquistas
│   └── index.ts
├── routes/                # Configuração de rotas
│   └── index.tsx
├── services/              # Camada de serviços
│   ├── cache.service.ts  # Serviço de cache
│   └── steam.service.ts  # Serviço Steam (lógica de negócio)
├── store/                 # Estado global (Zustand)
│   ├── theme.store.ts    # Store de tema
│   ├── toast.store.ts    # Store de notificações
│   └── index.ts
├── styles/                # Estilos globais
│   └── index.css         # CSS global + Tailwind
├── types/                 # Definições TypeScript
│   └── index.ts          # Interfaces e tipos
├── utils/                 # Utilitários
│   ├── formatters.ts     # Funções de formatação
│   └── index.ts
├── App.tsx               # Componente raiz
└── main.tsx              # Entry point
```

## 🏗️ Arquitetura

### Fluxo de Dados

```
User Interface (Pages/Components)
         ↓
   Custom Hooks (useSteam*)
         ↓
  Service Layer (steamService)
         ↓
   Cache Service (opcional)
         ↓
  API Layer (steamApiClient)
         ↓
    Steam Web API
```

### Camadas da Aplicação

#### 1. **API Layer** (`src/api/`)
- Cliente HTTP configurado com Axios
- Retry automático em falhas
- Timeout e tratamento de erros global
- Interceptors para logging e tratamento

#### 2. **Service Layer** (`src/services/`)
- Lógica de negócio centralizada
- Cache em memória para otimização
- Transformação de dados da API
- Abstração de chamadas complexas

#### 3. **Hooks Layer** (`src/hooks/`)
- Hooks customizados para consumo de dados
- Gerenciamento de estado de loading/error
- Integração com services
- Reutilização de lógica

#### 4. **Component Layer** (`src/components/`)
- Componentes UI reutilizáveis
- Props tipadas com TypeScript
- Componentes presentacionais puros
- Skeleton loaders para UX

#### 5. **Pages Layer** (`src/pages/`)
- Páginas completas da aplicação
- Composição de componentes
- Uso de hooks para dados
- Lógica específica de página

#### 6. **State Management** (`src/store/`)
- Zustand para estado global
- Theme (dark/light mode)
- Toast notifications
- Estado minimalista

## 📚 Guias de Desenvolvimento

### Como Adicionar uma Nova Feature

1. **Criar tipos** em `src/types/index.ts`
2. **Adicionar método na API** em `src/api/steam.ts`
3. **Criar service** em `src/services/`
4. **Criar hook customizado** em `src/hooks/`
5. **Criar componentes** necessários em `src/components/`
6. **Criar página** em `src/pages/`
7. **Adicionar rota** em `src/routes/index.tsx`

### Como Integrar uma Nova API

```typescript
// 1. Adicionar método no API client (src/api/steam.ts)
async getNewData(param: string) {
  const url = `${STEAM_API_BASE_URL}/ISteamUser/NewEndpoint/v1/`;
  return this.get(url, {
    params: {
      key: API_KEY,
      param: param,
    },
  });
}

// 2. Criar service (src/services/new.service.ts)
class NewService {
  async fetchNewData(param: string) {
    const cacheKey = `new:${param}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const data = await steamApiClient.getNewData(param);
    cacheService.set(cacheKey, data);
    return data;
  }
}

// 3. Criar hook (src/hooks/useNewData.ts)
export function useNewData(param: string) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // fetch logic
  }, [param]);
  
  return { data, isLoading };
}
```

### Boas Práticas

#### TypeScript
- ✅ Sempre tipar props, state e retornos
- ✅ Usar interfaces para objetos complexos
- ✅ Evitar `any` - use `unknown` se necessário
- ✅ Usar enums para valores fixos

#### Componentes
- ✅ Componentes pequenos e focados
- ✅ Extrair lógica para hooks
- ✅ Props tipadas com interface
- ✅ Usar composition over inheritance

#### Performance
- ✅ Usar `useMemo` para cálculos pesados
- ✅ Usar `useCallback` para funções em deps
- ✅ Lazy loading de imagens
- ✅ Pagination para listas grandes

#### Estado
- ✅ Estado local quando possível
- ✅ Zustand para estado global mínimo
- ✅ Cache em service layer
- ✅ Evitar prop drilling

#### Estilo
- ✅ TailwindCSS classes
- ✅ Dark mode com `dark:` prefix
- ✅ Responsive design mobile-first
- ✅ Consistent spacing e colors

## 🔧 Configuração Avançada

### Customizar Cache

Edite `src/services/cache.service.ts`:

```typescript
const cacheService = new CacheService(
  10 * 60 * 1000  // 10 minutos (padrão: 5)
);
```

### Customizar Retry

Edite `src/api/steam.ts`:

```typescript
const MAX_RETRIES = 3;  // Número de tentativas
const RETRY_DELAY = 1000;  // Delay entre tentativas (ms)
```

### Customizar Tema

Edite `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      steam: {
        dark: '#171a21',
        // adicione suas cores
      },
    },
  },
}
```

## 🐛 Troubleshooting

### Problema: CORS Error

**Solução**: Use um proxy CORS. Configure `VITE_CORS_PROXY` no `.env`.

### Problema: API Key Inválida

**Solução**: Verifique se a chave está correta no `.env` e reinicie o servidor.

### Problema: Profile Privado

**Solução**: Perfis privados da Steam não retornam dados. Teste com perfis públicos.

### Problema: Build Falha

**Solução**: 
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📖 Documentação Adicional

- [Arquitetura Detalhada](./docs/architecture.md)
- [Steam Web API Docs](https://partner.steamgames.com/doc/webapi_overview)
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- Steam Web API
- React Team
- Vite Team
- TailwindCSS Team
- Comunidade Open Source

---

**Desenvolvido com ❤️ e ☕**

Para dúvidas ou sugestões, abra uma issue no repositório.
