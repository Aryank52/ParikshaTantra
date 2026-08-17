import express from 'express';
import http from 'http';
import cors from 'cors';
import { CONFIG } from './config';
import { WebSocketService } from './services/websocketService';
import { seedDatabase } from './seed';

// Import Routes
import authRoutes from './routes/authRoutes';
import candidateRoutes from './routes/candidateRoutes';
import vaultRoutes from './routes/vaultRoutes';
import blueprintRoutes from './routes/blueprintRoutes';
import examRoutes from './routes/examRoutes';
import centreRoutes from './routes/centreRoutes';
import jitRoutes from './routes/jitRoutes';
import cbtRoutes from './routes/cbtRoutes';
import socRoutes from './routes/socRoutes';
import leakRoutes from './routes/leakRoutes';
import auditRoutes from './routes/auditRoutes';
import resultRoutes from './routes/resultRoutes';
import simulatorRoutes from './routes/simulatorRoutes';

const app = express();
const server = http.createServer(app);

// Global Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Request Logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'ParikshaTantra Secure National Examination Infrastructure',
    timestamp: new Date().toISOString(),
    securityState: 'ZERO_TRUST_ENFORCED',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/blueprint', blueprintRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/centres', centreRoutes);
app.use('/api/jit', jitRoutes);
app.use('/api/cbt', cbtRoutes);
app.use('/api/soc', socRoutes);
app.use('/api/leak', leakRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/simulator', simulatorRoutes);

// Initialize WebSockets
WebSocketService.initialize(server);

// Start Server & Auto Seed
server.listen(CONFIG.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🛡️  PARIKSHATANTRA SECURE SERVER RUNNING ON PORT ${CONFIG.PORT}`);
  console.log(`🔗 WebSockets Active at ws://localhost:${CONFIG.PORT}/ws`);
  console.log(`=======================================================`);

  try {
    await seedDatabase();
  } catch (err) {
    console.error('Seed auto-execution notice:', err);
  }
});
