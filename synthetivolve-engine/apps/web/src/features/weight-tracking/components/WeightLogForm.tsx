// apps/web/src/features/weight-tracking/components/WeightLogForm.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@repo/ui/components/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { trpc } from '@/lib/trpc';
import { toast } from "sonner" // You'll want a toast library like sonner

const formSchema = z.object({
  weight: z.coerce.number().positive('Weight must be positive'),
});

export function WeightLogForm({ onEntryAdded }: { onEntryAdded: () => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { weight: undefined },
  });

  const logWeightMutation = trpc.weight.logWeight.useMutation({
    onSuccess: () => {
      toast.success("Weight logged successfully!");
      onEntryAdded(); // This will trigger a refetch in the parent
      form.reset();
    },
    onError: (error) => {
       toast.error(`Error: ${error.message}`);
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    logWeightMutation.mutate({
      weight_lb: values.weight,
      entry_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Today's Weight (lbs)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="180.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={logWeightMutation.isLoading}>
          {logWeightMutation.isLoading ? 'Logging...' : 'Log Weight'}
        </Button>
      </form>
    </Form>
  );
}