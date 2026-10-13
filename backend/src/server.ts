import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './db/database.js';
import { apiRouter } from './routes/api.js';

const app = express();
const PORT = process.env.PORT || 4000;

// 🛡️ SECURE CODING: Security Headers via Helmet (CSP, X-Frame-Options, HSTS)
app.use(helmet());

// Enable CORS for frontend integration
app.use(cors({
  origin: '*', // Allow local frontend access
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-student-id', 'x-actor-id']
}));

// Body parsing with size limitations (Defense against Denial of Service payload flooding)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// Mount Core API routes
app.use('/api', apiRouter);

// Initialize DB schema & seed data
initializeDatabase();

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 NFSU Secure Department Inventory API Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🛡️ Secure Coding Protections: Active (Zod, SHA-256 Audit, Helmet)`);
  console.log(`=======================================================`);
});
