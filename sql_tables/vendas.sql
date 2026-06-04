-- TABELA DE PRODUTOS VENDIDOS
CREATE TABLE vendas_cestas (
    id SERIAL PRIMARY KEY,
    cesta_id INT NOT NULL,
    carrinho_id INT,
    cliente_nome VARCHAR(150) NOT NULL DEFAULT 'Cliente',
    cliente_telefone VARCHAR(30),
    endereco_entrega TEXT,
    observacoes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    preco_pago DECIMAL(10, 2) NOT NULL,
    pago BOOLEAN NOT NULL DEFAULT FALSE,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
