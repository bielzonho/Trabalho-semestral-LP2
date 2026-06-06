import express from "express";
import cors from "cors";
import helmet from "helmet";
import axios from "axios";

const app  = express();
const PORT = 3015;

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "null"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "100kb" }));

// ── Armazenamento em memória (seção 4.3.50 da apostila) ──────────
// Permite que serviços que ficaram offline solicitem eventos perdidos
type Evento = { tipo: string; dados: unknown };
const eventos: Evento[] = [];

// ── Destinatários registrados ────────────────────────────────────
// Cada microsserviço expõe POST /eventos para receber o broadcast
const DESTINATARIOS = [
  "http://localhost:3010/eventos",  // catalogo-cestas
  "http://localhost:3011/eventos",  // pedidos
  "http://localhost:3012/eventos",  // produtos  ← processa PedidoEfetivado
  "http://localhost:3013/eventos",  // auth
  "http://localhost:3014/eventos",  // verificacao-email
];

// ── POST /eventos ────────────────────────────────────────────────
// Recebe evento de qualquer microsserviço, armazena e faz broadcast
app.post("/eventos", (req, res) => {
  const evento = req.body as Evento;

  if (!evento?.tipo) {
    return res.status(400).json({ mensagem: "Evento inválido: campo 'tipo' obrigatório." });
  }

  eventos.push(evento);
  console.log(`\n[Barramento] ✉ Evento recebido: ${evento.tipo}`);
  console.log(`[Barramento] Total armazenado: ${eventos.length}`);

  // Broadcast assíncrono — falhas silenciosas (apostila seção 4.3.47)
  for (const url of DESTINATARIOS) {
    axios.post(url, evento).catch((err: Error) => {
      console.log(`[Barramento] ⚠ Falha ao entregar para ${url}: ${err.message}`);
    });
  }

  return res.status(200).json({ msg: "ok" });
});

// ── GET /eventos ─────────────────────────────────────────────────
// Microsserviços que reiniciaram podem solicitar eventos perdidos
// (apostila seção 4.3.51)
app.get("/eventos", (_req, res) => {
  return res.status(200).json(eventos);
});

app.get("/", (_req, res) =>
  res.json({ servico: "Barramento de eventos", status: "online", porta: PORT, totalEventos: eventos.length })
);

app.listen(PORT, () => {
  console.log(`Barramento de eventos rodando em http://localhost:${PORT}`);
});
