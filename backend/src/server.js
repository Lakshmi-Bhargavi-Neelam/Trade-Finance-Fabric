const express = require('express');
const cors = require('cors');
const gatewayManager = require('./fabric/gatewayManager');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const lcRoutes = require('./routes/lcRoutes');
const documentRoutes = require('./routes/documentRoutes');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', healthRoutes);
app.use('/api/lcs', lcRoutes);
app.use('/api/documents', documentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use(errorHandler);

async function start() {
  console.log('Connecting to Hyperledger Fabric peers...');
  await gatewayManager.connectAll();

  const server = app.listen(config.port, () => {
    console.log(`Trade Finance API listening on http://localhost:${config.port}`);
    console.log(`  Health:  GET  /api/health`);
    console.log(`  Roles:   GET  /api/roles`);
    console.log(`  LCs:     /api/lcs`);
  });

  const shutdown = async () => {
    console.log('\nShutting down...');
    server.close();
    await gatewayManager.closeAll();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

module.exports = app;
