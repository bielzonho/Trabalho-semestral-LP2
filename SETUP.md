# Guia de Uso - Sistema de Cestas e Pedidos

## 📋 Estrutura de Microserviços

O sistema está dividido em 3 microserviços independentes:

### 1. **Serviço de Produtos** (porta 3002)
Gerencia o catálogo de produtos disponíveis.

**Endpoints:**
- `GET http://localhost:3002/produtos` - Listar todos os produtos
- `GET http://localhost:3002/produtos/ativos` - Listar apenas produtos ativos
- `GET http://localhost:3002/produtos/:id` - Obter produto específico
- `POST http://localhost:3002/produtos` - Criar novo produto
- `PUT http://localhost:3002/produtos/:id` - Atualizar produto
- `DELETE http://localhost:3002/produtos/:id` - Deletar produto

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

### 2. **Serviço de Cestas** (porta 3000)
Gerencia cestas (modelos prontos) e seus itens.

**Endpoints:**
- `GET http://localhost:3000/cestas` - Listar todas as cestas
- `GET http://localhost:3000/cestas/ativas` - Listar apenas cestas ativas
- `GET http://localhost:3000/cestas/:id` - Obter cesta específica
- `POST http://localhost:3000/cestas` - Criar nova cesta
- `PUT http://localhost:3000/cestas/:id` - Atualizar cesta
- `POST http://localhost:3000/cestas/:id/itens` - Adicionar item à cesta
- `DELETE http://localhost:3000/cestas/:id` - Deletar cesta
- `DELETE http://localhost:3000/cestas/:cestaId/itens/:itemId` - Remover item da cesta

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

### 3. **Serviço de Pedidos** (porta 3001)
Gerencia pedidos dos clientes e seus itens.

**Endpoints:**
- `GET http://localhost:3001/pedidos` - Listar todos os pedidos
- `GET http://localhost:3001/pedidos/:id` - Obter pedido específico
- `GET http://localhost:3001/pedidos/status/:status` - Listar pedidos por status
- `POST http://localhost:3001/pedidos` - Criar novo pedido
- `PUT http://localhost:3001/pedidos/:id` - Atualizar pedido
- `PATCH http://localhost:3001/pedidos/:id/status` - Atualizar status do pedido
- `POST http://localhost:3001/pedidos/:id/itens` - Adicionar item ao pedido
- `DELETE http://localhost:3001/pedidos/:id` - Deletar pedido
- `DELETE http://localhost:3001/pedidos/:pedidoId/itens/:itemId` - Remover item do pedido

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
cd back/produtos && npm install
cd ../catalogo-cestas && npm install
cd ../pedidos && npm install
```

**2. Executar cada microserviço em um terminal diferente:**

```bash
# Terminal 1 - Produtos (porta 3002)
cd back/produtos
npm run dev

# Terminal 2 - Cestas (porta 3000)
cd back/catalogo-cestas
npm run dev

# Terminal 3 - Pedidos (porta 3001)
cd back/pedidos
npm run dev
```

**3. Abrir o Frontend:**

Abra o arquivo `front/index.html` em um navegador web.

Ou se preferir uma interface visual mais organizada, acesse as páginas:
- `front/produtos.html` - Gerenciador de Produtos
- `front/cestas.html` - Gerenciador de Cestas
- `front/pedidos.html` - Gerenciador de Pedidos

## 🔧 Integração com Banco de Dados Supabase

Para integrar com um banco de dados real (Supabase PostgreSQL), você precisará:

1. **Criar as tabelas no Supabase** usando o schema SQL fornecido
2. **Instalar o cliente Supabase** em cada microserviço:
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Atualizar os arquivos de dados** para fazer queries ao banco em vez de usar arrays em memória

4. **Exemplo de integração (para `back/produtos/src/data/produtos.ts`):**
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_ANON_KEY
   );

   export async function carregarProdutos() {
     const { data, error } = await supabase
       .from('produtos')
       .select('*')
       .eq('ativo', true);
     
     if (error) throw error;
     return data;
   }
   ```

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
Dados (Em memória ou Supabase)
```

## 📌 Notas Importantes

- Os dados são atualmente armazenados em memória e serão perdidos ao reiniciar os servidores
- Para um ambiente de produção, integre com o Supabase ou outro banco de dados
- Os microserviços utilizam CORS habilitado para aceitar requisições do frontend
- As validações são feitas tanto no frontend quanto no backend
