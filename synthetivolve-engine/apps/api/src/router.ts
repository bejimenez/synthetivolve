// apps/api/src/router.ts
import { initTRPC } from '@trpc/server';
import { weightRouter } from './routers/weight'; // Import the new router

// Make sure to export 't' so other files can use it
export const t = initTRPC.create();

export const appRouter = t.router({
  // All weight-related endpoints will be under the 'weight' namespace
  // e.g., client will call `trpc.weight.getWeightEntries.useQuery()`
  weight: weightRouter,
  
  // ...add other routers here later, like 'nutrition: nutritionRouter'
});