# Guia de Uso - Sistema de Cestas e Pedidos

## 📋 Estrutura de Microserviços

O sistema está dividido em 3 microserviços independentes:

### 1. **Serviço de Produtos** (porta 3012)
Gerencia o catálogo de produtos disponíveis.

**Endpoints:**
- `GET http://localhost:3012/produtos` - Listar todos os produtos
- `GET http://localhost:3012/produtos/ativos` - Listar apenas produtos ativos
- `GET http://localhost:3012/produtos/:id` - Obter produto específico
- `POST http://localhost:3012/produtos` - Criar novo produto
- `PUT http://localhost:3012/produtos/:id` - Atualizar produto
- `DELETE http://localhost:3012/produtos/:id` - Deletar produto

**Formato de Produto:**
```json
{
  "id": "uuid",
  "nome": "Café Premium",
  "descricao": "Café especial importado",
  "preco": 25.90,
  "ativo": true,
  "criadoEm": "2024-01-01T10:00:00Z"
}
```

### 2. **Serviço de Cestas** (porta 3010)
Gerencia cestas (modelos prontos) e seus itens.

**Endpoints:**
- `GET http://localhost:3010/cestas` - Listar todas as cestas
- `GET http://localhost:3010/cestas/ativas` - Listar apenas cestas ativas
- `GET http://localhost:3010/cestas/:id` - Obter cesta específica
- `POST http://localhost:3010/cestas` - Criar nova cesta
- `PUT http://localhost:3010/cestas/:id` - Atualizar cesta
- `POST http://localhost:3010/cestas/:id/itens` - Adicionar item à cesta
- `DELETE http://localhost:3010/cestas/:id` - Deletar cesta
- `DELETE http://localhost:3010/cestas/:cestaId/itens/:itemId` - Remover item da cesta

**Formato de Cesta:**
```json
{
  "id": "uuid",
  "nome": "Cesta Clássica",
  "descricao": "Cesta tradicional com café da manhã",
  "precoBase": 79.90,
  "ativa": true,
  "criadoEm": "2024-01-01T10:00:00Z",
  "itens": [
    {
      "id": "uuid",
      "cestaId": "uuid",
      "produtoId": "uuid",
      "quantidade": 6,
      "criadoEm": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### 3. **Serviço de Pedidos** (porta 3011)
Gerencia pedidos dos clientes e seus itens.

**Endpoints:**
- `GET http://localhost:3011/pedidos` - Listar todos os pedidos
- `GET http://localhost:3011/pedidos/:id` - Obter pedido específico
- `GET http://localhost:3011/pedidos/status/:status` - Listar pedidos por status
- `POST http://localhost:3011/pedidos` - Criar novo pedido
- `PUT http://localhost:3011/pedidos/:id` - Atualizar pedido
- `PATCH http://localhost:3011/pedidos/:id/status` - Atualizar status do pedido
- `POST http://localhost:3011/pedidos/:id/itens` - Adicionar item ao pedido
- `DELETE http://localhost:3011/pedidos/:id` - Deletar pedido
- `DELETE http://localhost:3011/pedidos/:pedidoId/itens/:itemId` - Remover item do pedido

**Formato de Pedido:**
```json
{
  "id": "uuid",
  "clienteNome": "João Silva",
  "cestaId": "uuid ou null",
  "status": "pendente",
  "valorTotal": 150.00,
  "observacoes": "Entregar de manhã",
  "criadoEm": "2024-01-01T10:00:00Z",
  "itens": [
    {
      "id": "uuid",
      "pedidoId": "uuid",
      "produtoId": "uuid",
      "quantidade": 2,
      "precoUnitario": 25.90,
      "criadoEm": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Status disponíveis:**
- `pendente` - Pedido aguardando confirmação
- `confirmado` - Pedido confirmado
- `em_preparacao` - Em processo de preparação
- `saiu_para_entrega` - Saiu para entrega
- `entregue` - Entregue ao cliente
- `cancelado` - Pedido cancelado

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- npm

### Instalação e Execução

**1. Instalar dependências em cada microserviço:**

```bash
npm install
npm run install:services
```

**2. Executar todos os microserviços:**

```bash
npm run dev
```

Esse comando inicia:
- Produtos: `http://localhost:3012`
- Cestas: `http://localhost:3010`
- Pedidos: `http://localhost:3011`

**3. Abrir o Frontend:**

Abra o arquivo `front/index.html` em um navegador web.

Ou se preferir uma interface visual mais organizada, acesse as páginas:
- `front/produtos.html` - Gerenciador de Produtos
- `front/cestas.html` - Gerenciador de Cestas
- `front/pedidos.html` - Gerenciador de Pedidos

## 🔧 Integração com Banco de Dados Supabase

Os microserviços usam o Supabase como fonte de dados.

Configure o arquivo `.env` na raiz do projeto com:

```env
DB_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_do_supabase
```

Também são aceitos os nomes `SUPABASE_URL`, `SERVICE_ROLE_KEY` e `DB_SERVICE_KEY`.

> A chave `sb_publishable_...` funciona como chave pública e respeita as regras de RLS do Supabase. Se suas tabelas estiverem com RLS ativo e sem policies de leitura/escrita, as APIs podem retornar listas vazias ou "não encontrado", mesmo com dados no banco. Para backend local, prefira a `service_role key` no `.env` e nunca coloque essa chave no frontend.

Se preferir continuar usando chave pública, crie policies no Supabase, por exemplo:

```sql
CREATE POLICY "Permitir leitura anon produtos"
ON produtos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Permitir leitura anon cestas"
ON cestas FOR SELECT
TO anon
USING (true);

CREATE POLICY "Permitir leitura anon cesta_itens"
ON cesta_itens FOR SELECT
TO anon
USING (true);

CREATE POLICY "Permitir leitura anon pedidos"
ON pedidos FOR SELECT
TO anon
USING (true);

CREATE POLICY "Permitir leitura anon pedido_itens"
ON pedido_itens FOR SELECT
TO anon
USING (true);
```

As rotas consultam diretamente as tabelas:
- `produtos`
- `cestas`
- `cesta_itens`
- `pedidos`
- `pedido_itens`

## 🎨 Frontend

O frontend foi construído com HTML5, CSS3 e JavaScript vanilla, sem dependências externas.

**Páginas disponíveis:**
- `index.html` - Home page
- `produtos.html` - Gerenciar Produtos (CRUD completo)
- `cestas.html` - Gerenciar Cestas e seus itens
- `pedidos.html` - Gerenciar Pedidos e seus itens
- `api.js` - Biblioteca compartilhada com funções de API

**Funcionalidades:**
- ✅ Listagem com busca em tempo real
- ✅ Criar, editar e deletar registros
- ✅ Gerenciar itens dentro de cestas e pedidos
- ✅ Cálculo automático de valores totais
- ✅ Formatação de datas e moedas
- ✅ Interface responsiva e intuitiva

## 📝 Schema de Banco de Dados

O schema SQL completo foi fornecido e inclui:
- Tabela `produtos` - Catálogo de produtos
- Tabela `cestas` - Modelos de cestas prontas
- Tabela `cesta_itens` - Itens que compõem cada cesta
- Tabela `pedidos` - Pedidos dos clientes
- Tabela `pedido_itens` - Itens de cada pedido com preço unitário

## 🔗 Fluxo de Dados

```
Frontend (HTML/JS)
    ↓
API em JavaScript (api.js)
    ↓
Microserviços (Express/Node.js)
    ↓
Banco de Dados Supabase
```

## 📌 Notas Importantes

- Os dados são armazenados no Supabase
- Os arquivos `src/data/*.ts` são apenas dados antigos de exemplo e não são usados pelas rotas atuais
- Os microserviços utilizam CORS habilitado para aceitar requisições do frontend
- As validações são feitas tanto no frontend quanto no backend
