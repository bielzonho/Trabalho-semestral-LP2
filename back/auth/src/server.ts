import path from "path";
import * as dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";

const app = express();
const PORT = 3013;

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "null"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  return res.json({
    servico: "Microserviço de autenticação",
    status: "online",
    porta: PORT
  });
});

app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Auth rodando em http://localhost:${PORT}`);
});
