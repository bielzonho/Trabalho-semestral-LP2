-- TABELA DE ITENS (PRODUTOS INDIVIDUAIS)
CREATE TABLE itens (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    quantidade_estoque INT NOT NULL DEFAULT 0,
    quantidade_vendas INT NOT NULL DEFAULT 0
);

-- TABELA DE CESTAS
CREATE TABLE cestas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    total_itens INT NOT NULL DEFAULT 0,
    quantidade_vendas INT NOT NULL DEFAULT 0
);

-- TABELA DE ASSOCIAÇÃO (MUITOS-PARA-MUITOS)
CREATE TABLE cesta_itens (
    cesta_id INT NOT NULL,
    item_id INT NOT NULL,
    PRIMARY KEY (cesta_id, item_id),
    FOREIGN KEY (cesta_id) REFERENCES cestas(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE CASCADE
);