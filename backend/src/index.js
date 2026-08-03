import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { sequelize } from './models/index.js';
import apiRoutes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api', apiRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
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
