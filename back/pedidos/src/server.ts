import express from "express";
import cors from "cors";
import pedidosRoutes from "./routes/pedido.routes";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  return res.json({
    servico: "Back-end de pedidos de cestas de café da manhã",
    status: "online"
  });
});

app.use("/pedidos", pedidosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});