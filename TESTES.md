# 🧪 Guia de Testes

## Testando a Aplicação Completa

### Pré-requisitos
- Node.js 18 ou superior
- 3 terminais de linha de comando disponíveis
- Um navegador web moderno

---

## 1️⃣ Fase 1: Iniciar os Servidores

### Terminal 1 - Microserviço de Produtos (Porta 3002)
```bash
cd back/produtos
npm install
npm run dev
```
**Esperado:** Mensagem `Servidor rodando em http://localhost:3002`

### Terminal 2 - Microserviço de Cestas (Porta 3000)
```bash
cd back/catalogo-cestas
npm install
npm run dev
```
**Esperado:** Mensagem `Servidor rodando em http://localhost:3000`

### Terminal 3 - Microserviço de Pedidos (Porta 3001)
```bash
cd back/pedidos
npm install
npm run dev
```
**Esperado:** Mensagem `Servidor rodando em http://localhost:3001`

---

## 2️⃣ Fase 2: Testar APIs com cURL

### Teste 1: Listar Produtos
```bash
curl http://localhost:3002/produtos
```
**Esperado:** Array com 8 produtos pré-carregados

### Teste 2: Criar Novo Produto
```bash
curl -X POST http://localhost:3002/produtos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Bolo de Chocolate",
    "descricao": "Bolo caseiro delicioso",
    "preco": 35.00,
    "ativo": true
  }'
```
**Esperado:** Produto criado com ID gerado

### Teste 3: Listar Cestas
```bash
curl http://localhost:3000/cestas
```
**Esperado:** Array com 2 cestas pré-carregadas com seus itens

### Teste 4: Listar Pedidos
```bash
curl http://localhost:3001/pedidos
```
**Esperado:** Array com 2 pedidos pré-carregados com seus itens

### Teste 5: Atualizar Status de Pedido
```bash
curl -X PATCH http://localhost:3001/pedidos/[PEDIDO_ID]/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmado"}'
```
**Esperado:** Pedido com status alterado para "confirmado"

---

## 3️⃣ Fase 3: Testar Frontend

### Abrir Páginas
Abra os seguintes arquivos em um navegador (pode usar `File > Open File`):
1. `front/produtos.html`
2. `front/cestas.html`
3. `front/pedidos.html`

---

## 4️⃣ Testes Funcionais Detalhados

### 📋 Página de Produtos (`produtos.html`)

**✅ Teste 1: Listar Produtos**
1. Abra a página
2. Veja grid com 8 produtos
3. Clique "Atualizar"
4. **Esperado:** Lista permanece a mesma (servidor disponível)

**✅ Teste 2: Buscar Produto**
1. Digite "Café" na caixa de busca
2. **Esperado:** Apenas "Café Premium" aparece
3. Limpe a busca
4. **Esperado:** Todos os produtos retornam

**✅ Teste 3: Criar Novo Produto**
1. Clique "+ Novo Produto"
2. Modal abre com campos vazios
3. Preencha:
   - Nome: "Pão de Queijo"
   - Descrição: "Pão de queijo caseiro"
   - Preço: "5.50"
   - Status: "Ativo"
4. Clique "Salvar"
5. **Esperado:** Alerta "Produto criado com sucesso!" e novo produto aparece na grid

**✅ Teste 4: Editar Produto**
1. No grid, clique "Editar" em um produto
2. Modal abre com dados preenchidos
3. Altere o preço para "25.00"
4. Clique "Salvar"
5. **Esperado:** Alerta "Produto atualizado com sucesso!" e preço atualizado

**✅ Teste 5: Deletar Produto**
1. Clique "Deletar" em um produto
2. Confirme no diálogo
3. **Esperado:** Alerta "Produto deletado com sucesso!" e produto desaparece

---

### 🧺 Página de Cestas (`cestas.html`)

**✅ Teste 1: Listar Cestas**
1. Abra a página
2. Veja 2 cestas em cards
3. Cada cesta mostra seus itens
4. **Esperado:** "Cesta Clássica" e "Cesta Premium" com seus produtos

**✅ Teste 2: Buscar Cesta**
1. Digite "Clássica" na busca
2. **Esperado:** Apenas "Cesta Clássica" aparece
3. Digite "Premium"
4. **Esperado:** Apenas "Cesta Premium" aparece

**✅ Teste 3: Criar Nova Cesta**
1. Clique "+ Nova Cesta"
2. Modal abre
3. Preencha:
   - Nome: "Cesta Executiva"
   - Descrição: "Para profissionais ocupados"
   - Preço Base: "150.00"
   - Status: "Ativa"
4. Clique "+ Adicionar Item" (3 vezes)
5. Selecione produtos diferentes em cada item
6. Defina quantidades (ex: 1, 2, 1)
7. Clique "Salvar"
8. **Esperado:** "Cesta Executiva" aparece com 3 itens

**✅ Teste 4: Editar Cesta e seus Itens**
1. Clique "Editar" em uma cesta
2. Modal abre com itens existentes
3. Remova um item clicando "Remover"
4. Adicione novo item
5. Clique "Salvar"
6. **Esperado:** Cesta atualizada com novos itens

**✅ Teste 5: Deletar Cesta**
1. Clique "Deletar" em uma cesta
2. Confirme
3. **Esperado:** Cesta removida da lista

---

### 📦 Página de Pedidos (`pedidos.html`)

**✅ Teste 1: Listar Pedidos**
1. Abra a página
2. Veja tabela com 2 pedidos
3. **Esperado:** Colunas: Cliente, Status, Valor Total, Data, Ações

**✅ Teste 2: Expandir Pedido (Ver Itens)**
1. Na tabela, veja uma segunda linha cinza abaixo de cada pedido
2. **Esperado:** Detalhes dos itens aparecem com produto, quantidade e valor

**✅ Teste 3: Buscar Pedido**
1. Digite "André" na busca
2. **Esperado:** Apenas pedido do André aparece
3. Digite "Mariana"
4. **Esperado:** Apenas pedido da Mariana aparece

**✅ Teste 4: Criar Novo Pedido**
1. Clique "+ Novo Pedido"
2. Modal abre
3. Preencha:
   - Nome do Cliente: "João da Silva"
   - Cesta: "Cesta Clássica" (opcional)
   - Observações: "Entregar de manhã"
4. Clique "+ Adicionar Item" (2 vezes)
5. Selecione 2 produtos diferentes
6. Defina quantidades
7. **Esperado:** Valor total é calculado automaticamente
8. Clique "Salvar"
9. **Esperado:** "Pedido criado com sucesso!" e novo pedido aparece com status "Pendente"

**✅ Teste 5: Alterar Status do Pedido**
1. Clique "Status" em um pedido
2. Um `prompt` aparece com o status atual
3. Digite: "em_preparacao"
4. **Esperado:** Badge de status muda para "Em Preparação" em laranja
5. Tente outros status: "confirmado", "entregue"
6. **Esperado:** Cores mudam conforme o status

**✅ Teste 6: Editar Pedido**
1. Clique "Editar" em um pedido
2. Modal abre com dados preenchidos
3. Altere quantidade de um item
4. **Esperado:** Valor total é recalculado
5. Remova um item
6. **Esperado:** Valor total é recalculado novamente
7. Clique "Salvar"
8. **Esperado:** "Pedido atualizado com sucesso!"

**✅ Teste 7: Deletar Pedido**
1. Clique "Deletar" em um pedido
2. Confirme no diálogo com nome do cliente
3. **Esperado:** "Pedido deletado com sucesso!" e pedido desaparece

---

## 5️⃣ Testes de Integração

### ✅ Teste 1: Fluxo Completo Produto → Cesta → Pedido
1. Crie um novo produto em `produtos.html`
2. Vá para `cestas.html` 
3. Crie uma cesta usando o novo produto
4. Vá para `pedidos.html`
5. Crie um pedido usando a cesta criada
6. **Esperado:** O novo produto aparece nos itens do pedido

### ✅ Teste 2: Sincronização em Tempo Real
1. Abra `produtos.html` em uma aba
2. Abra `cestas.html` em outra aba
3. Crie um novo produto em `produtos.html`
4. Vá para `cestas.html` e crie uma cesta
5. Selecione o novo produto
6. **Esperado:** Novo produto está disponível na lista

### ✅ Teste 3: Botão Atualizar
1. Abra qualquer página
2. Crie um novo item em outra aba
3. Volte para a primeira aba
4. Clique "Atualizar"
5. **Esperado:** Novo item aparece na lista

---

## 6️⃣ Testes de Validação

### ✅ Teste 1: Campos Obrigatórios
1. Clique "+ Novo Produto"
2. Tente clicar "Salvar" sem preencher campos
3. **Esperado:** Campos obrigatórios mostram erro de validação

### ✅ Teste 2: Valores Numéricos
1. Tente inserir preço negativo
2. **Esperado:** Campo não aceita valor negativo

### ✅ Teste 3: Busca com Caracteres Especiais
1. Digite caracteres especiais na busca (@#$%)
2. **Esperado:** Busca funciona sem erros (retorna vazio)

---

## 7️⃣ Testes de Performance

### ✅ Teste 1: Grande Volume de Dados
1. Crie 10+ produtos
2. Crie 5+ cestas com múltiplos itens
3. Crie 10+ pedidos
4. **Esperado:** Interface permanece responsiva

### ✅ Teste 2: Busca com Muitos Resultados
1. Digite uma letra comum (ex: "a")
2. **Esperado:** Busca retorna resultados em < 500ms

---

## ❌ Testes de Erro (Comportamento Esperado)

### Teste 1: Servidor Desligado
1. Desligue um microserviço
2. Tente carregar dados naquele serviço
3. **Esperado:** Mensagem de erro aparece (ex: "Erro ao carregar")

### Teste 2: Deletar Item Inexistente
1. Tente deletar um item que já foi removido
2. **Esperado:** Erro tratado graciosamente

---

## 📊 Checklist de Testes

- [ ] Produtos são exibidos corretamente
- [ ] Busca funciona em tempo real
- [ ] CRUD completo de Produtos funciona
- [ ] Cestas são exibidas com itens
- [ ] Gerenciamento de itens em Cestas funciona
- [ ] Pedidos são exibidos em tabela
- [ ] Itens de Pedidos são expansíveis
- [ ] Status de Pedidos muda corretamente
- [ ] Valor total é calculado automaticamente
- [ ] Formatação de datas está correta
- [ ] Formatação de moeda está correta
- [ ] Cores de status são diferenciadas
- [ ] Modais abrem e fecham corretamente
- [ ] Confirmação antes de deletar funciona
- [ ] Alertas de sucesso aparecem
- [ ] Mensagens de erro aparecem
- [ ] Interface é responsiva
- [ ] Não há erros no console do navegador

---

## 🐛 Se Algo Não Funcionar

1. **Verifique se todos os 3 servidores estão rodando**
   - Terminal 1: Produtos (porta 3002)
   - Terminal 2: Cestas (porta 3000)
   - Terminal 3: Pedidos (porta 3001)

2. **Verifique o console do navegador** (F12 → Console)
   - Procure por mensagens de erro (em vermelho)
   - Verifique URLs das requisições

3. **Verifique os terminais dos servidores**
   - Procure por erros ou warnings
   - Verifique se o CORS está habilitado

4. **Limpe o cache do navegador**
   - Ctrl+Shift+Delete
   - Selecione "Arquivos em cache"
   - Recarregue a página (Ctrl+R)

5. **Verifique se as portas estão corretas**
   - Produtos: 3002
   - Cestas: 3000
   - Pedidos: 3001

---

## 📞 Suporte

Para mais informações, veja:
- [README.md](README.md) - Visão geral
- [SETUP.md](SETUP.md) - Instruções de instalação
- [IMPLEMENTACAO.md](IMPLEMENTACAO.md) - Detalhes técnicos
