-- TABELA PRINCIPAL DO CARRINHO
CREATE TABLE carrinhos (
    id SERIAL PRIMARY KEY,
    cesta_id INT NOT NULL, -- ID da cesta escolhida
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE ITENS ADICIONAIS (O VETOR DE ITENS A MAIS)
CREATE TABLE carrinho_itens_adicionais (
    id SERIAL PRIMARY KEY,
    carrinho_id INT NOT NULL,
    item_id INT NOT NULL, -- ID do item avulso adicionado
    quantidade INT NOT NULL DEFAULT 1,
    FOREIGN KEY (carrinho_id) REFERENCES carrinhos(id) ON DELETE CASCADE
);