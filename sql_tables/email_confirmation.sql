CREATE TABLE verificacoes_email (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email     TEXT        NOT NULL,
  codigo    VARCHAR(6)  NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  usado     BOOLEAN     NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verificacoes_email
  ON verificacoes_email (email, codigo, usado, expira_em);