// apps/api/src/index.ts
import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router'; // We will create this next

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // Allow requests from your web app

// Create the tRPC express adapter
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
  }),
);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

// Export the type of your AppRouter, this is used by the client.
export type AppRouter = typeof appRouter;