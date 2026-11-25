require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');

const db = require('./config/db');
const { User } = require('./models');
const { authenticate } = require('./auth/auth.middleware');
const { spec } = require('./openapi');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3001';

// Página do Swagger UI que lê a especificação em /v1/openapi.json
const SWAGGER_PAGE = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <title>Biblioteca API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>SwaggerUIBundle({ url: "/v1/openapi.json", dom_id: "#swagger-ui" })</script>
  </body>
</html>`;

// Rotas protegidas: [caminho na URL, pasta do módulo]
const PROTECTED_ROUTES = [
  ['user', 'user'],
  ['categories', 'category'],
  ['authors', 'author'],
  ['books', 'book'],
  ['readers', 'reader'],
  ['loans', 'loan'],
  ['reservations', 'reservation'],
  ['reports', 'report']
];

app.use(express.json());

// CORS liberado apenas para a origem do front-end
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONT_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Documentação
app.get('/v1/openapi.json', (req, res) => res.json(spec));
app.get('/v1/docs', (req, res) => res.type('html').send(SWAGGER_PAGE));

// Autenticação (pública) e demais módulos (exigem access token)
app.use('/v1/auth', require('./auth/auth.router'));
for (const [path, folder] of PROTECTED_ROUTES) {
  app.use(`/v1/${path}`, authenticate, require(`./${folder}/${folder}.router`));
}

// Tratamento centralizado de erros
app.use((error, req, res, next) => {
  if (error.name === 'ZodError') {
    const message = error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return res.status(400).json({ error: message });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: 'Já existe um registro com estes dados.' });
  }

  const status = error.status || 500;
  const message = error.status ? error.message : 'Erro interno do servidor.';
  res.status(status).json({ error: message });
});

// Cria o administrador inicial caso ainda não exista nenhum
async function ensureAdmin() {
  const existing = await User.findOne({ where: { isAdmin: true } });
  if (existing) return;

  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('Configure ADMIN_PASSWORD para criar o administrador');
  }

  await User.create({
    name: 'Administrador',
    username: 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@biblioteca.local',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
    isAdmin: true,
    active: true
  });
}

async function start() {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('Configure JWT_SECRET e JWT_REFRESH_SECRET no .env');
  }

  await db.sync();
  await ensureAdmin();

  app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`));
}

if (require.main === module) {
  start().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { app, start };
