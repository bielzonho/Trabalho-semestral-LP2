# Trabalho-semestral-LP2
Trabalho semestral de linguagens de Programação 2 e Arquitetura de Sistemas Computacionais, com desenvolvimento backend e frontend, com Javascript e Typescript, tanto para Back End quanto para Front End.

## 📦 Sistema de Cestas e Pedidos - Grãos & Cestas

Sistema completo para gerenciar produtos, cestas de café da manhã e pedidos de clientes.

### 🏗️ Arquitetura

- **3 Microserviços independentes** (Express + TypeScript)
  - Produtos (porta 3002)
  - Cestas (porta 3000)
  - Pedidos (porta 3001)
  
- **Frontend SPA** (HTML5 + CSS3 + JavaScript)
  - Página de Produtos com CRUD completo
  - Página de Cestas com gerenciamento de itens
  - Página de Pedidos com itens e status

### 🚀 Quick Start

1. **Instalar dependências:**
```bash
cd back/produtos && npm install
cd ../catalogo-cestas && npm install
cd ../pedidos && npm install
```

2. **Executar microserviços** (em terminais separados):
```bash
# Terminal 1
cd back/produtos && npm run dev

# Terminal 2
cd back/catalogo-cestas && npm run dev

# Terminal 3
cd back/pedidos && npm run dev
```

3. **Abrir Frontend:**
Abra em um navegador:
- `front/produtos.html` - Gerenciar Produtos
- `front/cestas.html` - Gerenciar Cestas
- `front/pedidos.html` - Gerenciar Pedidos

### 📋 Tabelas do Banco de Dados

```sql
-- Produtos disponíveis
CREATE TABLE produtos (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(150),
  descricao TEXT,
  preco NUMERIC(10,2),
  ativo BOOLEAN DEFAULT TRUE
);

-- Cestas (modelos prontos)
CREATE TABLE cestas (
  id BIGINT PRIMARY KEY,
  nome VARCHAR(150),
  descricao TEXT,
  preco_base NUMERIC(10,2),
  ativa BOOLEAN DEFAULT TRUE
);

-- Itens das cestas
CREATE TABLE cesta_itens (
  id BIGINT PRIMARY KEY,
  cesta_id BIGINT,
  produto_id BIGINT,
  quantidade INTEGER
);

-- Pedidos dos clientes
CREATE TABLE pedidos (
  id BIGINT PRIMARY KEY,
  cesta_id BIGINT,
  cliente_nome VARCHAR(150),
  status VARCHAR(30),
  valor_total NUMERIC(10,2)
);

-- Itens de cada pedido
CREATE TABLE pedido_itens (
  id BIGINT PRIMARY KEY,
  pedido_id BIGINT,
  produto_id BIGINT,
  quantidade INTEGER,
  preco_unitario NUMERIC(10,2)
);
```

### 🔌 API Endpoints

**Produtos:**
- `GET /produtos` - Listar todos
- `POST /produtos` - Criar
- `PUT /produtos/:id` - Atualizar
- `DELETE /produtos/:id` - Deletar

**Cestas:**
- `GET /cestas` - Listar todas
- `POST /cestas` - Criar
- `PUT /cestas/:id` - Atualizar
- `POST /cestas/:id/itens` - Adicionar item
- `DELETE /cestas/:id/itens/:itemId` - Remover item

**Pedidos:**
- `GET /pedidos` - Listar todos
- `POST /pedidos` - Criar
- `PUT /pedidos/:id` - Atualizar
- `PATCH /pedidos/:id/status` - Alterar status
- `POST /pedidos/:id/itens` - Adicionar item
- `DELETE /pedidos/:id/itens/:itemId` - Remover item

### 📖 Documentação Completa

Veja [SETUP.md](SETUP.md) para guia completo de instalação e uso.

# Integrantes:
André Freire Prino - 21.00476-5
Joaquim Anderlini Alves da Cunha - 22.00536-6
Gabriel Giardino Sprotte - 23.00964-0
Gabriel Fernandes Sabino - 23.01062-2
Guilherme Gonsales de Sá - 23.00882-2
Thiago Espigado Miras - 22.01836-0