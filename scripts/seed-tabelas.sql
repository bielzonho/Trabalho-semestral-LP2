-- Script de seed para popular as tabelas do projeto
-- Inclui produtos, cestas, cesta_itens, pedidos e pedido_itens

-- 1. Criação das tabelas
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cestas (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cesta_itens (
  id UUID PRIMARY KEY,
  cesta_id UUID NOT NULL REFERENCES cestas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY,
  nome_cliente TEXT NOT NULL,
  status TEXT NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id UUID PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Inserir produtos existentes
INSERT INTO produtos (id, nome, descricao, preco, ativo)
VALUES
  ('a5d8c6a2-94b5-4f5d-a1f3-0fcbdf6a8b1d', 'Café Premium', 'Café gourmet em grãos, torra média.', 28.90, TRUE),
  ('b9a8a8f1-2f12-4f1f-8e9d-5a9e03d2a5f1', 'Pão Francês', 'Pão macio e crocante, feito na hora.', 3.50, TRUE),
  ('c6b7e4d2-3f8a-4b1d-8c1a-49e2d6f7a0c1', 'Croissant', 'Croissant amanteigado com leve toque doce.', 7.90, TRUE),
  ('d1f2e3c4-5b6a-4c7d-8e9f-1a2b3c4d5e6f', 'Leite Integral', 'Leite fresco integral 1L.', 6.20, TRUE),
  ('e2f3a4b5-6c7d-4e8f-9a0b-1c2d3e4f5a6b', 'Queijo Minas', 'Queijo Minas frescal em fatias.', 19.50, TRUE),
  ('f3e4d5c6-7b8a-4c9d-0e1f-2a3b4c5d6e7f', 'Geleia de Morango', 'Geleia artesanal de morango.', 12.00, TRUE),
  ('a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d', 'Suco de Laranja', 'Suco natural de laranja 1L.', 9.80, TRUE),
  ('b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e', 'Maçã Fuji', 'Maçã Fuji fresca, unidade.', 4.20, TRUE);

-- 3. Inserir cestas já criadas
INSERT INTO cestas (id, nome, descricao, preco, ativa)
VALUES
  ('c1e2d3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f', 'Cesta Clássica', 'Cesta com itens básicos para café da manhã.', 75.00, TRUE),
  ('d2f3e4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'Cesta Premium', 'Cesta premium com itens gourmets selecionados.', 135.00, TRUE);

-- 4. Associar produtos às cestas
INSERT INTO cesta_itens (id, cesta_id, produto_id, quantidade)
VALUES
  ('f1e2d3c4-5b6a-4c7d-8e9f-0a1b2c3d4e5f', 'c1e2d3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f', 'a5d8c6a2-94b5-4f5d-a1f3-0fcbdf6a8b1d', 1),
  ('e1d2c3b4-5a6f-4e7d-8c9b-0a1e2d3c4b5f', 'c1e2d3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f', 'b9a8a8f1-2f12-4f1f-8e9d-5a9e03d2a5f1', 2),
  ('d1c2b3a4-5f6e-4d7c-8b9a-0e1d2c3b4a5f', 'd2f3e4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'a5d8c6a2-94b5-4f5d-a1f3-0fcbdf6a8b1d', 1),
  ('c1b2a3d4-5e6f-4d7c-8b9a-0f1e2d3c4b5a', 'd2f3e4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'c6b7e4d2-3f8a-4b1d-8c1a-49e2d6f7a0c1', 2),
  ('b1a2c3d4-5e6f-4d7c-8b9a-0f1e2d3c4b5c', 'd2f3e4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a', 'f3e4d5c6-7b8a-4c9d-0e1f-2a3b4c5d6e7f', 1);

-- 5. Exemplo de pedidos e itens de pedidos (opcional)
INSERT INTO pedidos (id, nome_cliente, status, valor_total)
VALUES
  ('p1a2b3c4-5d6e-4f7a-8b9c-0d1e2f3a4b5c', 'Juliana Santos', 'pendente', 160.40),
  ('p2b3c4d5-6e7f-4a8b-9c0d-1e2f3a4b5c6d', 'Lucas Ferreira', 'confirmado', 92.30);

INSERT INTO pedido_itens (id, pedido_id, produto_id, quantidade, preco_unitario)
VALUES
  ('q1w2e3r4-5t6y-7u8i-9o0p-1a2s3d4f5g6', 'p1a2b3c4-5d6e-4f7a-8b9c-0d1e2f3a4b5c', 'a5d8c6a2-94b5-4f5d-a1f3-0fcbdf6a8b1d', 1, 28.90),
  ('w1e2r3t4-5y6u-7i8o-9p0a-1s2d3f4g5h6', 'p1a2b3c4-5d6e-4f7a-8b9c-0d1e2f3a4b5c', 'b9a8a8f1-2f12-4f1f-8e9d-5a9e03d2a5f1', 3, 3.50),
  ('e1r2t3y4-5u6i-7o8p-9a0s-1d2f3g4h5j6', 'p2b3c4d5-6e7f-4a8b-9c0d-1e2f3a4b5c6d', 'c6b7e4d2-3f8a-4b1d-8c1a-49e2d6f7a0c1', 2, 7.90),
  ('r1t2y3u4-5i6o-7p8a-9s0d-1f2g3h4j5k6', 'p2b3c4d5-6e7f-4a8b-9c0d-1e2f3a4b5c6d', 'b9a8a8f1-2f12-4f1f-8e9d-5a9e03d2a5f1', 4, 3.50);

-- 6. Consulta para verificar produtos
SELECT *
FROM produtos
ORDER BY nome;

-- 7. Consulta de produtos dentro de cestas
SELECT
  p.id AS produto_id,
  p.nome AS produto,
  p.preco,
  ci.quantidade,
  c.id AS cesta_id,
  c.nome AS cesta_nome
FROM cesta_itens ci
INNER JOIN produtos p ON ci.produto_id = p.id
INNER JOIN cestas c ON ci.cesta_id = c.id
ORDER BY c.nome, p.nome;
