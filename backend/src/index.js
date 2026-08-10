import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { sequelize } from './models/index.js';
import apiRoutes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api', apiRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const isDevelopment = process.env.NODE_ENV !== 'production';
const frontendProxyTarget = process.env.FRONTEND_SERVER || 'http://localhost:4173';

if (isDevelopment) {
  app.use(
    '/',
    createProxyMiddleware({
      target: frontendProxyTarget,
      changeOrigin: true,
      ws: true,
      logLevel: 'warn',
      onProxyReq(proxyReq) {
        proxyReq.setHeader('X-Forwarded-Host', `localhost:${process.env.PORT || 8080}`);
      },
    })
  );
} else {
  const staticPath = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.use(errorHandler);

const port = process.env.PORT || 8080;

sequelize.sync({ alter: true }).then(() => {
  const server = app.listen(port, () => {
    console.log(`WorkPulse backend running on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Ensure no other backend process is running and retry.`);
      process.exit(1);
    }
    console.error('Server failed to start:', error);
    process.exit(1);
  });
}).catch((error) => {
  console.error('Database sync failed:', error);
  process.exit(1);
});
