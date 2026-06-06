import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import produtosRoutes from "./routes/produtos.routes";
import eventosRoutes  from "./routes/eventos.routes";

const app = express();
const PORT = 3012;

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "null"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  return res.json({
    servico: "Back-end de produtos",
    status: "online"
  });
});

app.use("/produtos", produtosRoutes);
app.use("/eventos",  eventosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
