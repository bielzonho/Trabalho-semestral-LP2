import express from "express";
import cors from "cors";
import cestasRoutes from "./routes/cestas.routes";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  return res.json({
    servico: "Back-end de cestas de café da manhã",
    status: "online"
  });
});

app.use("/cestas", cestasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});