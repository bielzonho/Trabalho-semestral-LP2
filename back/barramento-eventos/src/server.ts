import express from "express";
import cors from "cors";
import helmet from "helmet";
import axios from "axios";

const app  = express();
const PORT = 3015;

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "null"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "100kb" }));

// ── Armazenamento em memória (seção 4.3.50 da apostila) ──────────
// Permite que serviços que ficaram offline solicitem eventos perdidos.
// Cada evento armazenado ganha um `id` sequencial e `emitidoEm`; o log guarda
// só os MAX_EVENTOS mais recentes para não crescer sem limite.
type Evento = { tipo: string; dados: unknown };
type EventoArmazenado = Evento & { id: number; emitidoEm: string };

const MAX_EVENTOS = 1000;
const eventos: EventoArmazenado[] = [];
let proximoId = 1;

// ── Destinatários registrados ────────────────────────────────────
// Cada microsserviço expõe POST /eventos para receber o broadcast
const DESTINATARIOS = [
  process.env.CATALOGO_CESTAS_URL || "http://localhost:3010/eventos",       // catalogo-cestas
  process.env.PEDIDOS_URL || "http://localhost:3011/eventos",               // pedidos
  process.env.PRODUTOS_URL || "http://localhost:3012/eventos",              // produtos  ← processa PedidoEfetivado
  process.env.AUTH_URL || "http://localhost:3013/eventos",                  // auth
  process.env.VERIFICACAO_EMAIL_URL || "http://localhost:3014/eventos",     // verificacao-email (Node)
  // verificacao-email em Dart (porta 3016) — roda em paralelo ao serviço Node
  process.env.VERIFICACAO_EMAIL_DART_URL || "http://localhost:3016/eventos",
];

// ── Entrega com timeout e retry ──────────────────────────────────
// Falhas de rede e respostas 5xx são repetidas (backoff exponencial).
// Respostas 4xx não são repetidas: o destinatário respondeu, só não
// consome esse evento (ex.: 404 em serviços sem POST /eventos).
const TIMEOUT_MS = 5000;
const MAX_TENTATIVAS = 3;
const BACKOFF_BASE_MS = 500;

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function entregar(url: string, evento: EventoArmazenado): Promise<void> {
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      await axios.post(url, evento, { timeout: TIMEOUT_MS });
      return;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const erro = err as NodeJS.ErrnoException;
      const motivo = status ? `status ${status}` : (erro.code || erro.message || "erro de rede");

      if (status !== undefined && status < 500) {
        console.log(`[Barramento] ⚠ ${url} não consumiu "${evento.tipo}" (${motivo})`);
        return;
      }
      if (tentativa === MAX_TENTATIVAS) {
        console.log(`[Barramento] ✖ Falha ao entregar para ${url} após ${MAX_TENTATIVAS} tentativas: ${motivo}`);
        return;
      }
      await esperar(BACKOFF_BASE_MS * 2 ** (tentativa - 1));
    }
  }
}

// ── POST /eventos ────────────────────────────────────────────────
// Recebe evento de qualquer microsserviço, armazena e faz broadcast
app.post("/eventos", (req, res) => {
  const recebido = req.body as Evento;

  if (!recebido?.tipo) {
    return res.status(400).json({ mensagem: "Evento inválido: campo 'tipo' obrigatório." });
  }

  const evento: EventoArmazenado = {
    ...recebido,
    id: proximoId++,
    emitidoEm: new Date().toISOString(),
  };
  eventos.push(evento);
  if (eventos.length > MAX_EVENTOS) eventos.shift();

  console.log(`\n[Barramento] ✉ Evento recebido: ${evento.tipo} (#${evento.id})`);
  console.log(`[Barramento] Total armazenado: ${eventos.length}`);

  // Broadcast assíncrono (fire and forget) — a resposta ao emissor não espera a entrega
  for (const url of DESTINATARIOS) {
    void entregar(url, evento);
  }

  return res.status(200).json({ msg: "ok" });
});

// ── GET /eventos ─────────────────────────────────────────────────
// Microsserviços que reiniciaram podem solicitar eventos perdidos
// (apostila seção 4.3.51). `?desde=<id>` devolve só os eventos com id MAIOR
// que o informado; sem o parâmetro, devolve todos os armazenados.
app.get("/eventos", (req, res) => {
  const bruto = req.query.desde;
  if (bruto === undefined) {
    return res.status(200).json(eventos);
  }

  const desde = Number(bruto);
  if (!Number.isInteger(desde) || desde < 0) {
    return res.status(400).json({ mensagem: "Parâmetro 'desde' deve ser um inteiro >= 0." });
  }
  return res.status(200).json(eventos.filter((e) => e.id > desde));
});

app.get("/", (_req, res) =>
  res.json({ servico: "Barramento de eventos", status: "online", porta: PORT, totalEventos: eventos.length })
);

app.listen(PORT, () => {
  console.log(`Barramento de eventos rodando em http://localhost:${PORT}`);
});
