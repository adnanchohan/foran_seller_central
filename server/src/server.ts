import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

await connectDatabase();

const server = app.listen(env.port, () => {
  console.info(`Foran Seller Central API listening on http://localhost:${env.port}`);
});

async function shutdown(signal: string) {
  console.info(`${signal} received. Closing the API gracefully.`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
