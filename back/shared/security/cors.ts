export const corsConfig = {
  origin: ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "null"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
