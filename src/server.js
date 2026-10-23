const app = require('./app');
const { sequelize } = require('./db');
const { port } = require('./config');

(async () => {
  await sequelize.authenticate();
  // shortcut: sync() creates missing tables but does not migrate changed ones; add sequelize-cli migrations before changing the schema in production.
  await sequelize.sync();
  const server = app.listen(port, () => console.log(`API on :${port} — docs at /api/docs`));

  const shutdown = () => server.close(() => sequelize.close().then(() => process.exit(0)));
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
