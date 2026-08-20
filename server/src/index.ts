import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import { CONFIG, validateSecrets } from './config';

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
import catalogRoutes from './routes/catalogRoutes';
import registrationRoutes from './routes/registrationRoutes';
import controlTowerRoutes from './routes/controlTowerRoutes';
import paperRoutes from './routes/paperRoutes';
import hardwareCheckRoutes from './routes/hardwareCheckRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
const server = http.createServer(app);

// Global Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Request Logger & Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
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
app.use('/api/catalog', catalogRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/control-tower', controlTowerRoutes);
app.use('/api/paper', paperRoutes);
app.use('/api/hardware-check', hardwareCheckRoutes);
app.use('/api/ai', aiRoutes);

// Structured Central Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('🔥 Server Error Unhandled Exception:', err);
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Examination Platform Error',
    timestamp: new Date().toISOString(),
  });
});

// Initialize WebSockets
WebSocketService.initialize(server);

// Start Server & Auto Seed
server.listen(CONFIG.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🛡️  PARIKSHATANTRA SECURE SERVER RUNNING ON PORT ${CONFIG.PORT}`);
  console.log(`🔗 WebSockets Active at ws://localhost:${CONFIG.PORT}/ws`);
  console.log(`=======================================================`);
  validateSecrets();

  try {
    await seedDatabase();
  } catch (err) {
    console.error('Seed auto-execution notice:', err);
  }
});
