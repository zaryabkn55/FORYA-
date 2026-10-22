import { app } from './app';
import { connectDB, prisma } from './db/config';
import { env, assertProductionReady } from './env';
import { sweepAiBudget } from './lib/aiBudget';

/**
 * Boot order matters: validate the environment before anything opens a socket, so a
 * misconfigured deploy fails at startup — where the platform will show it as a failed
 * release and keep the previous version serving — rather than half-working in public.
 */
assertProductionReady();

async function main() {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.log(`🚀 FORYA API listening on :${env.port} (${env.nodeEnv})`);
  });

  // Keep-alive slightly above the typical 60s proxy idle timeout, so the load balancer
  // closes connections rather than the app returning a 502 mid-request.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 70_000;

  const sweeper = setInterval(sweepAiBudget, 10 * 60_000);
  sweeper.unref();

  /**
   * Graceful shutdown. Platforms send SIGTERM and then kill the process a few seconds
   * later; without this, in-flight requests are cut off mid-response on every deploy.
   */
  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    console.log(`${signal} received — finishing in-flight requests…`);

    const forced = setTimeout(() => {
      console.error('Shutdown timed out; exiting.');
      process.exit(1);
    }, 15_000);
    forced.unref();

    server.close(async () => {
      clearTimeout(forced);
      await prisma.$disconnect().catch(() => {});
      console.log('Closed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // An unhandled rejection leaves the process in an unknown state. Log loudly and let the
  // platform restart it rather than serving from a half-broken instance.
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    void shutdown('uncaughtException');
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
