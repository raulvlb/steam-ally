# 🏗️ Arquitetura do Steam Ally

## Visão Geral

O Steam Ally foi projetado seguindo os princípios de **Clean Architecture** e **Separation of Concerns**, garantindo escalabilidade, manutenibilidade e testabilidade.

## Princípios Arquiteturais

### 1. Separação de Camadas

A aplicação é dividida em camadas distintas, cada uma com responsabilidades bem definidas:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Pages, Components, Hooks)           │
├─────────────────────────────────────────┤
│         Business Logic Layer            │
│         (Services, Store)               │
├─────────────────────────────────────────┤
│         Data Access Layer               │
│         (API Client, Cache)             │
├─────────────────────────────────────────┤
│         External Services               │
│         (Steam Web API)                 │
└─────────────────────────────────────────┘
```

### 2. Dependency Injection

As camadas superiores dependem de abstrações, não de implementações concretas. Isso permite fácil substituição e testing.

### 3. Single Responsibility

Cada módulo, classe ou função tem uma única responsabilidade bem definida.

## Estrutura Detalhada

### 📁 API Layer (`src/api/`)

**Responsabilidade**: Comunicação com APIs externas.

#### `steam.ts` - Cliente HTTP Steam

```typescript
class SteamApiClient {
  - client: AxiosInstance
  - retry logic
  - error handling
  - timeout management
  
  + get<T>(url: string): Promise<T>
  + getPlayerSummaries(steamIds: string[])
  + getOwnedGames(steamId: string)
  + getPlayerAchievements(steamId: string, appId: number)
  // ... outros métodos
}
```

**Características**:
- Singleton pattern
- Retry automático (3 tentativas)
- Timeout configurável (10s)
- Tratamento global de erros
- CORS proxy support
- Type-safe com TypeScript

### 📁 Services Layer (`src/services/`)

**Responsabilidade**: Lógica de negócio e orquestração.

#### `cache.service.ts` - Sistema de Cache

```typescript
class CacheService {
  - cache: Map<string, CacheEntry>
  - defaultTTL: number
  
  + set<T>(key: string, data: T, ttl?: number)
  + get<T>(key: string): T | null
  + has(key: string): boolean
  + clear()
  + clearExpired()
}
```

**Características**:
- Cache em memória com TTL
- Auto-limpeza de entradas expiradas
- Helper methods para chaves comuns
- Type-safe

#### `steam.service.ts` - Lógica de Negócio Steam

```typescript
class SteamService {
  + resolveSteamId(input: string): Promise<string>
  + getUserProfile(steamId: string): Promise<UserProfile>
  + getOwnedGames(steamId: string): Promise<GameDetails[]>
  + getGameAchievements(steamId, appId): Promise<Achievements>
  + searchGames(steamId: string, query: string): Promise<Games[]>
}
```

**Características**:
- Abstração da API layer
- Transformação de dados
- Integração com cache
- Validação e sanitização
- Error handling amigável

### 📁 Hooks Layer (`src/hooks/`)

**Responsabilidade**: Integração React com services, gerenciamento de estado local.

#### Hooks Disponíveis

1. **`useDebounce`** - Debounce de valores
   ```typescript
   const debouncedValue = useDebounce(value, 500);
   ```

2. **`useSteamProfile`** - Fetch de perfil
   ```typescript
   const { profile, isLoading, error, refetch } = useSteamProfile(steamId);
   ```

3. **`useSteamGames`** - Fetch de jogos
   ```typescript
   const { games, isLoading, error } = useSteamGames(steamId);
   ```

4. **`useSteamAchievements`** - Fetch de conquistas
   ```typescript
   const { achievements, stats, isLoading } = useSteamAchievements(steamId, appId);
   ```

5. **`usePagination`** - Paginação de arrays
   ```typescript
   const pagination = usePagination(data, { pageSize: 20 });
   ```

**Características**:
- Encapsulam lógica de fetching
- Gerenciam loading/error states
- Integração automática com toast
- Reusabilidade

### 📁 Store Layer (`src/store/`)

**Responsabilidade**: Estado global da aplicação.

#### Stores Zustand

1. **`theme.store.ts`** - Gerenciamento de tema
   ```typescript
   interface ThemeStore {
     isDarkMode: boolean;
     toggleTheme: () => void;
   }
   ```

2. **`toast.store.ts`** - Sistema de notificações
   ```typescript
   interface ToastStore {
     toasts: Toast[];
     addToast: (toast) => void;
     removeToast: (id) => void;
   }
   ```

**Características**:
- Estado mínimo e focado
- Persistência (localStorage)
- Type-safe
- Performance otimizada

### 📁 Components Layer (`src/components/`)

**Responsabilidade**: UI reutilizável e apresentacional.

#### Componentes Principais

1. **Layout**
   - `Navbar` - Navegação principal
   
2. **UI Primitivos**
   - `Card` - Container básico
   - `Button` - Botão customizado
   - `ProgressBar` - Barra de progresso
   - `Pagination` - Paginação

3. **Feedback**
   - `Skeleton` - Loading states
   - `Toast` - Notificações
   
4. **Domain**
   - `GameCard` - Card de jogo
   - `AchievementCard` - Card de conquista

**Características**:
- Props tipadas
- Composição
- Acessibilidade
- Responsividade
- Dark mode support

### 📁 Pages Layer (`src/pages/`)

**Responsabilidade**: Páginas completas, composição de componentes.

#### Páginas Disponíveis

1. **`HomePage`** - Landing page com busca
2. **`ProfilePage`** - Perfil do usuário
3. **`GamesPage`** - Lista de jogos com filtros
4. **`AchievementsPage`** - Conquistas de um jogo

**Características**:
- Layout completo
- Uso de hooks
- Composição de componentes
- SEO friendly

### 📁 Types Layer (`src/types/`)

**Responsabilidade**: Definições TypeScript centralizadas.

#### Categorias de Tipos

1. **Steam API Types** - Responses da API
2. **Application Types** - Tipos da aplicação
3. **UI Types** - Estado de UI
4. **Store Types** - Estado global

### 📁 Utils Layer (`src/utils/`)

**Responsabilidade**: Funções utilitárias puras.

#### Utilitários Disponíveis

- `formatPlaytime()` - Formata minutos
- `formatDate()` - Formata timestamps
- `getPersonaStateLabel()` - Labels de status
- `extractSteamId()` - Extrai ID de URL
- `isValidSteamId()` - Valida Steam ID

## Fluxo de Dados

### Fetch de Dados

```
1. User Action (click, input)
         ↓
2. Page/Component usa Hook
         ↓
3. Hook chama Service
         ↓
4. Service verifica Cache
         ↓
5. Se não cached, chama API
         ↓
6. API faz request HTTP
         ↓
7. Response transformada no Service
         ↓
8. Dados salvos no Cache
         ↓
9. Hook atualiza estado
         ↓
10. Component re-renderiza
```

### State Management

```
1. Ação de UI
         ↓
2. Store action chamada
         ↓
3. Store atualiza estado
         ↓
4. Subscribers re-renderizam
         ↓
5. Persistência (se aplicável)
```

## Padrões de Design Utilizados

### 1. Singleton Pattern
- **Onde**: API Client, Services, Cache
- **Por quê**: Instância única compartilhada

### 2. Repository Pattern
- **Onde**: Service Layer
- **Por quê**: Abstração de data access

### 3. Observer Pattern
- **Onde**: Zustand Stores
- **Por quê**: Reactive state updates

### 4. Factory Pattern
- **Onde**: Cache key generation
- **Por quê**: Criação consistente de chaves

### 5. Dependency Injection
- **Onde**: Services, Hooks
- **Por quê**: Desacoplamento e testabilidade

## Estratégias de Performance

### 1. Cache em Memória
- TTL configurável
- Auto-limpeza
- Chaves específicas por recurso

### 2. Lazy Loading
- Code splitting por rota
- Lazy images
- Skeleton loaders

### 3. Debouncing
- Inputs de busca
- Scroll handlers

### 4. Paginação
- Client-side pagination
- Renderização eficiente

### 5. Memoization
- useMemo para cálculos
- useCallback para funções
- React.memo para componentes

## Error Handling

### Estratégia em Camadas

1. **API Layer**
   - Catch HTTP errors
   - Retry em falhas de rede
   - Transform em errors amigáveis

2. **Service Layer**
   - Validação de dados
   - Transform em business errors
   - Logging

3. **Hook Layer**
   - Set error state
   - Show toast notification
   - Provide error to component

4. **Component Layer**
   - Display error UI
   - Provide retry action
   - Fallback UI

## Extensibilidade

### Adicionar Nova Página

1. Criar componente em `src/pages/`
2. Adicionar rota em `src/routes/`
3. Criar hooks necessários
4. Usar componentes existentes

### Adicionar Novo Endpoint Steam

1. Adicionar método em `src/api/steam.ts`
2. Criar service em `src/services/`
3. Criar hook em `src/hooks/`
4. Usar em componente/página

### Adicionar Novo Store

1. Criar store em `src/store/`
2. Definir tipos em `src/types/`
3. Export em `src/store/index.ts`
4. Usar com hooks do Zustand

## Testing Strategy (Futuro)

### Unit Tests
- Utils functions
- Services (com mock de API)
- Hooks (com React Testing Library)

### Integration Tests
- Fluxos completos
- API + Service + Hook

### E2E Tests
- User flows completos
- Cypress ou Playwright

## Melhores Práticas

### TypeScript
✅ **DO**: Sempre tipar retornos e parâmetros  
❌ **DON'T**: Usar `any` sem necessidade

### Components
✅ **DO**: Componentes pequenos e focados  
❌ **DON'T**: Lógica complexa em components

### State
✅ **DO**: Estado local quando possível  
❌ **DON'T**: Zustand para tudo

### Performance
✅ **DO**: Memoize cálculos pesados  
❌ **DON'T**: Otimizar prematuramente

## Conclusão

Esta arquitetura foi projetada para:

- ✅ Escalabilidade
- ✅ Manutenibilidade
- ✅ Testabilidade
- ✅ Performance
- ✅ Developer Experience

Seguindo estes padrões, o projeto pode crescer de forma sustentável e organizada.
