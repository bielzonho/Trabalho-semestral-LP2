import express from "express";
import cors from "cors";
import produtosRoutes from "./routes/produtos.routes";

const app = express();
const PORT = 3012;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  return res.json({
    servico: "Back-end de produtos",
    status: "online"
  });
});

app.use("/produtos", produtosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
