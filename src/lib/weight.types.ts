// src/lib/weight.types.ts
export interface WeightEntry {
  id: string
  user_id: string
  weight_lbs: number
  entry_date: string
  notes: string | null
  created_at: string
}

export interface WeightEntryInput {
  weight_lbs: number
  entry_date: string
  notes?: string
}
