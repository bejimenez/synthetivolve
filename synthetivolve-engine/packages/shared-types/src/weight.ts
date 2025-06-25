// packages/shared-types/src/weight.ts
import type { Database } from './database.types';

// This is the clean type for a weight entry
export type WeightEntry = Database['public']['Tables']['weight_entries']['Row'];