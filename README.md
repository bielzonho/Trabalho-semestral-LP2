# Trabalho-semestral-LP2

Trabalho semestral de Linguagens de Programação 2 e Arquitetura de Sistemas Computacionais, com desenvolvimento backend e frontend em JavaScript e TypeScript.

## Sistema de Cestas e Pedidos — Grão & Cesta

Sistema completo para gerenciar produtos, cestas de café da manhã e pedidos de clientes, com autenticação JWT, verificação de e-mail por OTP e controle de estoque.

---

## Arquitetura

**5 microserviços independentes** (Express + TypeScript) + Frontend estático:

| Serviço | Porta | Responsabilidade |
|---|---|---|
| Catálogo de Cestas | 3010 | CRUD de cestas |
| Pedidos | 3011 | Criação e gestão de pedidos + controle de estoque |
| Produtos | 3012 | CRUD de produtos com quantidade em estoque |
| Autenticação | 3013 | Login, registro de usuários, tokens JWT |
| Verificação de E-mail | 3014 | OTP por e-mail para confirmar acesso |

**Frontend** (HTML5 + CSS3 + JavaScript):

| Página | Acesso | Descrição |
|---|---|---|
| `index.html` | Cliente | Catálogo de cestas, catálogo de produtos, novo pedido, meus pedidos |
| `login.html` | Público | Login com verificação OTP, criação de conta |
| `pedidos.html` | Admin | Gestão completa de pedidos e status |
| `produtos.html` | Admin | CRUD de produtos e estoque |
| `cestas.html` | Admin | CRUD de cestas |
| `admin.html` | Admin | Painel administrativo |

---

## Quick Start

### 1. Configurar variáveis de ambiente

Copie e edite o arquivo `.env` na raiz do projeto:

```env
DB_URL=https://<projeto>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<chave>
JWT_SECRET=<segredo>

# SMTP para envio de e-mail OTP (opcional — sem isso, o código aparece no terminal)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@gmail.com
SMTP_PASS=senha_de_app_do_gmail
```

> **Sem SMTP configurado:** o código OTP é exibido no terminal do serviço 3014 para uso em desenvolvimento.

### 2. Instalar dependências

```bash
npm install
npm run install:services
```

### 3. Iniciar todos os microserviços

```bash
npm run dev
```

Sobe os 5 serviços simultaneamente:
- Cestas: `http://localhost:3010`
- Pedidos: `http://localhost:3011`
- Produtos: `http://localhost:3012`
- Auth: `http://localhost:3013`
- Verificação de e-mail: `http://localhost:3014`

### 4. Abrir o frontend

Abra os arquivos em `front/` com o Live Server do VS Code (porta 5500) ou equivalente.

---

## Fluxo de uso

### Cliente
1. Acessa `login.html` → faz login ou cria conta
2. Recebe código OTP por e-mail (ou vê no terminal em dev) → confirma
3. Em `index.html`: vê o catálogo de cestas e produtos disponíveis
4. Adiciona produtos extras ao pedido e envia
5. Acompanha seus pedidos na seção "Meus pedidos"

### Admin
1. Faz login → redirecionado para `admin.html`
2. Gerencia produtos, cestas (com itens padrão) e pedidos direto no painel `admin.html`
3. Ao confirmar/entregar um pedido, o estoque e o contador de vendas dos produtos são atualizados automaticamente
4. Páginas dedicadas: `produtos.html`, `cestas.html` e `pedidos.html`

---

## API Endpoints

### Auth — `http://localhost:3013`
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/login` | Público | Login com e-mail e senha |
| POST | `/auth/registrar` | Público | Criar nova conta (perfil cliente) |
| GET | `/auth/me` | Autenticado | Verificar token |

### Verificação de E-mail — `http://localhost:3014`
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/verificacao/enviar` | Público | Gera e envia OTP (10 min de validade) |
| POST | `/verificacao/confirmar` | Público | Valida o OTP |

### Produtos — `http://localhost:3012`
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/produtos` | Público | Listar todos os produtos |
| GET | `/produtos/ativos` | Público | Listar produtos com estoque > 0 |
| GET | `/produtos/:id` | Público | Detalhe de um produto |
| POST | `/produtos` | Admin | Criar produto |
| PUT | `/produtos/:id` | Admin | Atualizar produto |
| DELETE | `/produtos/:id` | Admin | Remover produto |

### Cestas — `http://localhost:3010`
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/cestas` | Público | Listar todas as cestas (com itens) |
| GET | `/cestas/:id` | Público | Detalhe de uma cesta |
| POST | `/cestas` | Admin | Criar cesta |
| PUT | `/cestas/:id` | Admin | Atualizar cesta e/ou seus itens padrão |
| POST | `/cestas/:id/itens` | Admin | Adicionar item à cesta |
| DELETE | `/cestas/:id` | Admin | Remover cesta |
| DELETE | `/cestas/:cestaId/itens/:itemId` | Admin | Remover item da cesta |

### Pedidos — `http://localhost:3011`
| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/pedidos` | Admin | Listar todos os pedidos |
| GET | `/pedidos/meus` | Autenticado | Listar pedidos do usuário logado |
| GET | `/pedidos/:id` | Admin | Detalhe de um pedido |
| POST | `/pedidos` | Cliente | Criar pedido |
| PUT | `/pedidos/:id` | Admin | Atualizar pedido |
| PATCH | `/pedidos/:id/status` | Admin | Alterar status (decrementa estoque ao confirmar/entregar) |
| DELETE | `/pedidos/:id` | Admin | Remover pedido |

---

## Tabelas do Banco de Dados (Supabase)

```sql
-- Produtos com controle de estoque
CREATE TABLE itens (
  id               BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  titulo           VARCHAR(150) NOT NULL,
  descricao        TEXT,
  preco            NUMERIC(10,2) NOT NULL,
  quantidade_estoque INTEGER DEFAULT 0,
  quantidade_vendas  INTEGER DEFAULT 0
);

-- Cestas de café da manhã
CREATE TABLE cestas (
  id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nome        VARCHAR(150) NOT NULL,
  descricao   TEXT,
  preco_base  NUMERIC(10,2) NOT NULL,
  ativa       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Itens de cada cesta
CREATE TABLE cesta_itens (
  id         BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  cesta_id   BIGINT REFERENCES cestas(id) ON DELETE CASCADE,
  item_id    BIGINT REFERENCES itens(id),
  quantidade INTEGER NOT NULL
);

-- Carrinhos (agrupa itens adicionais de um pedido)
CREATE TABLE carrinhos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cesta_id  BIGINT REFERENCES cestas(id),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Itens adicionais do carrinho
CREATE TABLE carrinho_itens_adicionais (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrinho_id UUID REFERENCES carrinhos(id) ON DELETE CASCADE,
  item_id     BIGINT REFERENCES itens(id),
  quantidade  INTEGER NOT NULL DEFAULT 1
);

-- Usuários cadastrados pelo sistema de registro
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,  -- hash bcrypt
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendas / Pedidos
CREATE TABLE vendas_cestas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cesta_id         BIGINT REFERENCES cestas(id),
  carrinho_id      UUID REFERENCES carrinhos(id),
  cliente_nome     VARCHAR(150),
  email_cliente    TEXT,
  cliente_telefone VARCHAR(50),
  endereco_entrega TEXT,
  observacoes      TEXT,
  status           VARCHAR(30) DEFAULT 'pendente',
  preco_pago       NUMERIC(10,2) NOT NULL,
  pago             BOOLEAN DEFAULT FALSE,
  data_venda       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_cliente_telefone
    CHECK (cliente_telefone IS NULL OR cliente_telefone ~ '^[0-9]+$')
);

-- Migrações necessárias se a tabela já existir:
-- ALTER TABLE vendas_cestas ADD COLUMN IF NOT EXISTS email_cliente TEXT;
-- ALTER TABLE vendas_cestas ADD CONSTRAINT check_cliente_telefone
--   CHECK (cliente_telefone IS NULL OR cliente_telefone ~ '^[0-9]+$');

-- Códigos OTP para verificação de e-mail
CREATE TABLE verificacoes_email (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email     TEXT NOT NULL,
  codigo    VARCHAR(6) NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  usado     BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verificacoes_email
  ON verificacoes_email (email, codigo, usado, expira_em);
```

---

## Controle de Estoque

Ao alterar o status de um pedido para **`confirmado`** ou **`entregue`** (pela primeira vez), o serviço de pedidos atualiza automaticamente cada produto do carrinho:
- Decrementa `quantidade_estoque` pela quantidade pedida (mínimo 0)
- Incrementa `quantidade_vendas` pela quantidade vendida

A transição `confirmado → entregue` não aplica o decremento novamente.

No frontend, produtos com estoque 0 aparecem como **"Indisponível"** e não podem ser adicionados ao pedido. Produtos com menos de 10 unidades exibem o badge **"Restam X"**.

---

## Segurança

| Camada | Implementação |
|---|---|
| Headers HTTP | `helmet` em todos os microserviços |
| CORS | Origin whitelist restrita (`localhost:5500`) |
| Autenticação | JWT com expiração de 8h, verificado em cada requisição |
| Autorização | RBAC — roles `admin` e `cliente` |
| Senhas | `bcryptjs` com salt 10 (nunca texto puro) |
| SQL Injection | Supabase ORM com queries parametrizadas |
| Payload | Limite de 100kb por requisição |
| OTP | Código de 6 dígitos com validade de 10 min, uso único |
| Telefone | Validação frontend + constraint no banco (somente dígitos) |

---

## Integrantes

| Nome | RA |
|---|---|
| André Freire Prino | 21.00476-5 |
| Gabriel Fernandes Sabino | 23.01062-2 |
| Gabriel Giardino Sprotte | 23.00964-0 |
| Guilherme Gonsales de Sá | 23.00882-2 |
| Joaquim Anderlini Alves da Cunha | 22.00536-6 |
| Thiago Espigado Miras | 22.01836-0 |
