// src/lib/goals.types.ts
import type { Database } from './database.types'

export interface Goal {
  id: string
  user_id: string
  goal_type: 'weight_loss' | 'weight_gain' | 'maintenance'
  target_weight?: number
  target_date?: string
  created_at: string
  updated_at: string
}

export interface GoalInsert {
  goal_type: 'weight_loss' | 'weight_gain' | 'maintenance'
  target_weight?: number
  target_date?: string
}

export interface GoalUpdate {
  goal_type?: 'weight_loss' | 'weight_gain' | 'maintenance'
  target_weight?: number
  target_date?: string
}
