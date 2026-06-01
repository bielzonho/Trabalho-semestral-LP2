import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cestasRoutes from "./routes/cestas.routes";

const app = express();
const PORT = 3010;

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "null"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  return res.json({
    servico: "Back-end de cestas",
    status: "online"
  });
});

app.use("/cestas", cestasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
