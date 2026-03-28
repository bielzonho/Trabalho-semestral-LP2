const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const url = (process.env.DB_URL || '').trim();
const key = (process.env.API_KEY || '').trim();

if (!url || !key) {
  console.error('Erro: faltam variáveis no .env (DB_URL / API_KEY).');
  process.exit(1);
}

const content = `// Arquivo gerado a partir do .env
window.SUPABASE_URL = '${url.replace(/'/g, "\\'")}';
window.SUPABASE_KEY = '${key.replace(/'/g, "\\'")}';
`;

const filePath = path.resolve(process.cwd(), 'front', 'supabase-config.js');
fs.writeFileSync(filePath, content, { encoding: 'utf8' });
console.log(`Arquivo gerado: ${filePath}`);
