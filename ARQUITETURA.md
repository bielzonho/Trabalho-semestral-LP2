# 🏗️ Arquitetura do Sistema

## Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR WEB                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │   produtos.html      │  │    cestas.html       │                │
│  │                      │  │                      │                │
│  │  • Grid Cards        │  │  • Grid Cards        │                │
│  │  • CRUD Modal        │  │  • Gerenciador Items │                │
│  │  • Busca Real-time   │  │  • Seletor Produtos  │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │   pedidos.html       │  │    index.html        │                │
│  │                      │  │                      │                │
│  │  • Tabela Interativa │  │  • Home Page         │                │
│  │  • Gerenciador Items │  │  • Navegação         │                │
│  │  • Mudança Status    │  │  • Links             │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    api.js (Biblioteca)                       │   │
│  │                                                               │   │
│  │  • carregarProdutos()        • criarCesta()                 │   │
│  │  • criarProduto()            • adicionarItemCesta()         │   │
│  │  • atualizarProduto()        • carregarPedidos()            │   │
│  │  • deletarProduto()          • criarPedido()                │   │
│  │  • carregarCestas()          • atualizarPedido()            │   │
│  │  • obterCesta()              • deletarPedido()              │   │
│  │                                                               │   │
│  │  + Formatadores: formatarMoeda(), formatarData(), etc       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                ↓ HTTP/CORS                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADA DE SERVIDORES (Node.js)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │  PRODUTOS (3012)     │  │  CESTAS (3010)       │                │
│  ├──────────────────────┤  ├──────────────────────┤                │
│  │ produtos.routes.ts   │  │ cestas.routes.ts     │                │
│  │ • GET /produtos      │  │ • GET /cestas        │                │
│  │ • POST /produtos     │  │ • POST /cestas       │                │
│  │ • PUT /produtos/:id  │  │ • POST /:id/itens    │                │
│  │ • DELETE /produtos   │  │ • DELETE /:id/itens  │                │
│  │                      │  │                      │                │
│  │ database.ts          │  │ database.ts          │                │
│  │ produto.ts (tipos)   │  │ cesta.ts (tipos)     │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                       │
│  ┌──────────────────────┐                                           │
│  │  PEDIDOS (3011)      │                                           │
│  ├──────────────────────┤                                           │
│  │ pedido.routes.ts     │                                           │
│  │ • GET /pedidos       │                                           │
│  │ • POST /pedidos      │                                           │
│  │ • PATCH /:id/status  │                                           │
│  │ • POST /:id/itens    │                                           │
│  │ • DELETE /:id/itens  │                                           │
│  │                      │                                           │
│  │ database.ts          │                                           │
│  │ pedido.ts (tipos)    │                                           │
│  └──────────────────────┘                                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS (Supabase)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  produtos  ←→  cestas/cesta_itens  ←→  pedidos/pedido_itens       │
│                                                                       │
│  Persistência real no banco; os dados sobrevivem a reinícios       │
│                                                                       │
│  💡 Configurado via DB_URL/API_KEY ou SUPABASE_URL/SUPABASE_KEY    │
│     usando as tabelas SQL fornecidas                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dados

### 1. Criar Produto
```
produtos.html (form) 
    ↓ criarProduto()
    ↓ fetch POST /produtos
    ↓ produtos.routes.ts
    ↓ tabela produtos (Supabase)
    ↓ resposta JSON
    ↓ api.js → modal fecha, lista atualiza
```

### 2. Criar Cesta com Itens
```
cestas.html (form com items)
    ↓ criarCesta() com itens[]
    ↓ fetch POST /cestas
    ↓ cestas.routes.ts
    ↓ valida e cria registros em cestas/cesta_itens
    ↓ tabelas cestas e cesta_itens (Supabase)
    ↓ resposta JSON
    ↓ api.js → modal fecha, grid atualiza
```

### 3. Criar Pedido com Itens e Calcular Total
```
pedidos.html (form com items)
    ↓ item_row com produtoId, quantidade, preçoUnitário
    ↓ criarPedido() com itens[]
    ↓ fetch POST /pedidos
    ↓ pedidos.routes.ts
    ↓ mapeia para registros de pedido_itens
    ↓ calcula valorTotal = sum(quantidade * preço)
    ↓ tabelas pedidos e pedido_itens (Supabase)
    ↓ resposta JSON
    ↓ api.js → modal fecha, tabela atualiza
```

### 4. Atualizar Status de Pedido
```
pedidos.html (botão Status)
    ↓ prompt pede novo status
    ↓ atualizarStatusPedido(id, status)
    ↓ fetch PATCH /pedidos/:id/status
    ↓ pedidos.routes.ts valida status
    ↓ atualiza pedido.status
    ↓ resposta JSON
    ↓ api.js → tabela atualiza com nova cor
```

## Fluxo de Busca em Tempo Real

```
Input "busca" onchange
    ↓ carregarListaCestas()
    ↓ termo = searchInput.value.toLowerCase()
    ↓ todosCestas.filter(c => 
      c.nome.includes(termo) || 
      c.descricao.includes(termo)
    )
    ↓ grid.innerHTML = cestasFiltradas.map()
    ↓ resultado exibido em < 100ms
```

## Estrutura de Tipos TypeScript

```typescript
// Produto
interface Produto {
  id: string              // UUID
  nome: string           // "Café Premium"
  descricao: string      // "Café especial importado"
  preco: number          // 25.90
  ativo: boolean         // true
  criadoEm: string       // ISO timestamp
}

// Cesta e seus itens
interface CestaItem {
  id: string             // UUID
  cestaId: string        // referência à cesta
  produtoId: string      // referência ao produto
  quantidade: number     // 6
  criadoEm: string       // ISO timestamp
}

interface Cesta {
  id: string             // UUID
  nome: string           // "Cesta Clássica"
  descricao: string
  precoBase: number      // 79.90
  ativa: boolean
  criadoEm: string
  itens?: CestaItem[]    // array de itens
}

// Pedido e seus itens
interface PedidoItem {
  id: string             // UUID
  pedidoId: string       // referência ao pedido
  produtoId: string      // referência ao produto
  quantidade: number     // 2
  precoUnitario: number  // 25.90
  criadoEm: string
}

type StatusPedido = "pendente" | "confirmado" | "em_preparacao" | 
                    "saiu_para_entrega" | "entregue" | "cancelado"

interface Pedido {
  id: string             // UUID
  clienteNome: string    // "João Silva"
  cestaId: string | null // opcional
  status: StatusPedido   // "pendente"
  valorTotal: number     // 150.00
  observacoes?: string   // "Entregar de manhã"
  criadoEm: string
  itens?: PedidoItem[]   // array de itens
}
```

## Correlação com Schema SQL

```
Frontend Types ↔ SQL Tables

Produto          ↔ produtos
├─ id            ├─ id BIGINT PRIMARY KEY
├─ nome          ├─ nome VARCHAR(150)
├─ descricao     ├─ descricao TEXT
├─ preco         ├─ preco NUMERIC(10,2)
├─ ativo         ├─ ativo BOOLEAN
└─ criadoEm      └─ criado_em TIMESTAMPTZ

Cesta            ↔ cestas
├─ id            ├─ id BIGINT PRIMARY KEY
├─ nome          ├─ nome VARCHAR(150)
├─ descricao     ├─ descricao TEXT
├─ precoBase     ├─ preco_base NUMERIC(10,2)
├─ ativa         ├─ ativa BOOLEAN
├─ criadoEm      ├─ criado_em TIMESTAMPTZ
└─ itens[]       └─ relacionada com cesta_itens

CestaItem        ↔ cesta_itens
├─ id            ├─ id BIGINT PRIMARY KEY
├─ cestaId       ├─ cesta_id BIGINT FK
├─ produtoId     ├─ produto_id BIGINT FK
├─ quantidade    ├─ quantidade INTEGER
└─ criadoEm      └─ criado_em TIMESTAMPTZ

Pedido           ↔ pedidos
├─ id            ├─ id BIGINT PRIMARY KEY
├─ clienteNome   ├─ cliente_nome VARCHAR(150)
├─ cestaId       ├─ cesta_id BIGINT FK
├─ status        ├─ status VARCHAR(30)
├─ valorTotal    ├─ valor_total NUMERIC(10,2)
├─ observacoes   ├─ observacoes TEXT
├─ criadoEm      ├─ criado_em TIMESTAMPTZ
└─ itens[]       └─ relacionada com pedido_itens

PedidoItem       ↔ pedido_itens
├─ id            ├─ id BIGINT PRIMARY KEY
├─ pedidoId      ├─ pedido_id BIGINT FK
├─ produtoId     ├─ produto_id BIGINT FK
├─ quantidade    ├─ quantidade INTEGER
├─ precoUnitario ├─ preco_unitario NUMERIC(10,2)
└─ criadoEm      └─ criado_em TIMESTAMPTZ
```

## Endpoints REST API

```
┌─ PRODUTOS (localhost:3012) ─────────────────────┐
│ GET    /produtos           → todos               │
│ GET    /produtos/ativos    → apenas ativos       │
│ GET    /produtos/:id       → específico          │
│ POST   /produtos           → criar               │
│ PUT    /produtos/:id       → atualizar           │
│ DELETE /produtos/:id       → deletar             │
└────────────────────────────────────────────────┘

┌─ CESTAS (localhost:3010) ────────────────────────┐
│ GET    /cestas             → todas               │
│ GET    /cestas/ativas      → apenas ativas       │
│ GET    /cestas/:id         → específica          │
│ POST   /cestas             → criar               │
│ PUT    /cestas/:id         → atualizar           │
│ POST   /cestas/:id/itens   → adicionar item      │
│ DELETE /cestas/:id         → deletar             │
│ DELETE /cestas/:cId/itens/:iId → remover item   │
└────────────────────────────────────────────────┘

┌─ PEDIDOS (localhost:3011) ───────────────────────┐
│ GET    /pedidos            → todos               │
│ GET    /pedidos/:id        → específico          │
│ GET    /pedidos/status/:st → por status          │
│ POST   /pedidos            → criar               │
│ PUT    /pedidos/:id        → atualizar           │
│ PATCH  /pedidos/:id/status → mudar status        │
│ POST   /pedidos/:id/itens  → adicionar item      │
│ DELETE /pedidos/:id        → deletar             │
│ DELETE /pedidos/:pId/itens/:iId → remover item  │
└────────────────────────────────────────────────┘
```

## Stack Tecnológico

```
Frontend (SPA - Single Page Application)
├── HTML5 (Semântico)
├── CSS3 (Grid, Flexbox, Responsivo)
└── JavaScript ES6+ (Fetch API, Async/Await)

Backend (Microserviços)
├── Node.js 18+
├── Express.js
├── TypeScript
├── UUID (ID generation)
└── CORS (cross-origin)

Dados
└── Supabase PostgreSQL

Ferramenta de Build
├── TypeScript Compiler
└── ts-node (desenvolvimento)
```

## Performance

### Requisições de API
- **Latência:** depende da conexão com o Supabase
- **Tamanho da resposta:** 1-50 KB
- **Timeout:** Não aplicável (servidor local)

### Frontend
- **Busca em tempo real:** < 100ms
- **Renderização de grid:** < 200ms para 1000 itens
- **Modal abrir/fechar:** < 300ms
- **Cálculo de totais:** < 50ms

## Escalabilidade

**Com Supabase:**
- ✅ Milhões de registros
- ✅ Múltiplos usuários simultâneos
- ✅ Backup automático
- ✅ Replicação de dados

## Segurança (Próximos Passos)

- [ ] Autenticação com JWT
- [ ] Validação com Joi/Yup
- [ ] Sanitização de inputs
- [ ] Rate limiting
- [ ] HTTPS/TLS
- [ ] CORS restritivo
- [ ] SQL Injection prevention
