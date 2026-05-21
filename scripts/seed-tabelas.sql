-- Script de criação e seed para o modelo atual do projeto
-- Tabelas: itens, cestas, cesta_itens, carrinhos, carrinho_itens_adicionais, vendas_cestas

CREATE TABLE IF NOT EXISTS itens (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  quantidade_estoque INT NOT NULL DEFAULT 0,
  quantidade_vendas INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cestas (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  total_itens INT NOT NULL DEFAULT 0,
  quantidade_vendas INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cesta_itens (
  cesta_id INT NOT NULL,
  item_id INT NOT NULL,
  PRIMARY KEY (cesta_id, item_id),
  FOREIGN KEY (cesta_id) REFERENCES cestas(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS carrinhos (
  id SERIAL PRIMARY KEY,
  cesta_id INT NOT NULL REFERENCES cestas(id) ON DELETE CASCADE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carrinho_itens_adicionais (
  id SERIAL PRIMARY KEY,
  carrinho_id INT NOT NULL REFERENCES carrinhos(id) ON DELETE CASCADE,
  item_id INT NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
  quantidade INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS vendas_cestas (
  id SERIAL PRIMARY KEY,
  cesta_id INT NOT NULL REFERENCES cestas(id) ON DELETE CASCADE,
  carrinho_id INT REFERENCES carrinhos(id) ON DELETE SET NULL,
  cliente_nome VARCHAR(150) NOT NULL DEFAULT 'Cliente',
  cliente_telefone VARCHAR(30),
  endereco_entrega TEXT,
  observacoes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  preco_pago DECIMAL(10, 2) NOT NULL,
  pago BOOLEAN NOT NULL DEFAULT FALSE,
  data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vendas_cestas
  ADD COLUMN IF NOT EXISTS carrinho_id INT REFERENCES carrinhos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(150) NOT NULL DEFAULT 'Cliente',
  ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pendente';

INSERT INTO itens (titulo, descricao, preco, quantidade_estoque)
VALUES
  ('Café Premium', 'Café gourmet em grãos, torra média.', 28.90, 20),
  ('Pão Francês', 'Pão macio e crocante, feito na hora.', 3.50, 50),
  ('Croissant', 'Croissant amanteigado com leve toque doce.', 7.90, 30),
  ('Leite Integral', 'Leite fresco integral 1L.', 6.20, 25),
  ('Queijo Minas', 'Queijo Minas frescal em fatias.', 19.50, 15),
  ('Geleia de Morango', 'Geleia artesanal de morango.', 12.00, 18),
  ('Suco de Laranja', 'Suco natural de laranja 1L.', 9.80, 25),
  ('Maçã Fuji', 'Maçã Fuji fresca, unidade.', 4.20, 40);

INSERT INTO cestas (titulo, descricao, preco, total_itens)
VALUES
  ('Cesta Clássica', 'Cesta com itens básicos para café da manhã.', 75.00, 4),
  ('Cesta Premium', 'Cesta premium com itens gourmets selecionados.', 135.00, 5);

INSERT INTO cesta_itens (cesta_id, item_id)
SELECT c.id, i.id
FROM cestas c
JOIN itens i ON i.titulo IN ('Café Premium', 'Pão Francês', 'Leite Integral', 'Maçã Fuji')
WHERE c.titulo = 'Cesta Clássica'
ON CONFLICT DO NOTHING;

INSERT INTO cesta_itens (cesta_id, item_id)
SELECT c.id, i.id
FROM cestas c
JOIN itens i ON i.titulo IN ('Café Premium', 'Croissant', 'Suco de Laranja', 'Queijo Minas', 'Geleia de Morango')
WHERE c.titulo = 'Cesta Premium'
ON CONFLICT DO NOTHING;

INSERT INTO carrinhos (cesta_id)
SELECT id FROM cestas WHERE titulo = 'Cesta Clássica' LIMIT 1;

INSERT INTO carrinho_itens_adicionais (carrinho_id, item_id, quantidade)
SELECT carrinhos.id, itens.id, 2
FROM carrinhos
JOIN itens ON itens.titulo = 'Croissant'
ORDER BY carrinhos.id DESC
LIMIT 1;

INSERT INTO vendas_cestas (
  cesta_id,
  carrinho_id,
  cliente_nome,
  cliente_telefone,
  endereco_entrega,
  observacoes,
  status,
  preco_pago,
  pago
)
SELECT
  c.id,
  ca.id,
  'Juliana Santos',
  '(11) 99999-9999',
  'Rua das Flores, 120 - Centro',
  'Entregar pela manhã',
  'pendente',
  c.preco,
  FALSE
FROM cestas c
LEFT JOIN carrinhos ca ON ca.cesta_id = c.id
WHERE c.titulo = 'Cesta Clássica'
ORDER BY ca.id DESC
LIMIT 1;

SELECT * FROM itens ORDER BY titulo;
SELECT * FROM cestas ORDER BY titulo;
SELECT * FROM cesta_itens ORDER BY cesta_id, item_id;
SELECT * FROM carrinhos ORDER BY criado_em DESC;
SELECT * FROM vendas_cestas ORDER BY data_venda DESC;
