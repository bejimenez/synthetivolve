// apps/api/src/routers/weight.ts
import { z } from 'zod';
import { t } from '../trpc'; // We need to export 't' from our main router file
import { supabase } from '../supabase';
import { TRPCError } from '@trpc/server';

export const weightRouter = t.router({
  // Procedure to get all weight entries for the logged-in user
  getWeightEntries: t.procedure
    .query(async ({ ctx }) => {
      // 'ctx.userId' will come from our authenticated context
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        // .eq('user_id', ctx.userId) // We'll add auth later, for now we fetch all
        .order('entry_date', { ascending: true });

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),

  // Procedure to log a new weight entry
  logWeight: t.procedure
    .input(
      z.object({
        weight_lb: z.number().positive(),
        entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
      })
    )
    .mutation(async ({ input }) => {
      // This is a placeholder user ID. In a real app, this would come
      // from the authenticated session context (ctx.userId).
      const FAKE_USER_ID = '00000000-0000-0000-0000-000000000000'; // Replace with a real test user UUID from your db

      const { data, error } = await supabase
        .from('weight_entries')
        .upsert({
          user_id: FAKE_USER_ID,
          weight_lb: input.weight_lb,
          entry_date: input.entry_date,
        })
        .select()
        .single(); // .upsert() combined with the unique constraint is perfect for this

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      return data;
    }),
});