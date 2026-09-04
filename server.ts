import path from 'path';
import express from 'express';
import { apiApp } from './api/app';

const PORT = 3000;
const app = express();

// Mount API application
app.use(apiApp);

// Static files in production
const distDir = path.resolve(process.cwd(), 'dist');
app.use(express.static(distDir));

// Fallback to index.html for SPA client-side routing
app.use((req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ARIF Laboratory Inventory & Reservation Server running on port ${PORT}`);
});
