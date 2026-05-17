import path from "path";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const SUPABASE_URL = process.env.DB_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.API_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Faltam variáveis de ambiente: SUPABASE_URL / SUPABASE_KEY ou DB_URL / API_KEY"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
