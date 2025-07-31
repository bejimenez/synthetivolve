// src/hooks/useGoals.ts
import { useAppData } from '@/components/data/AppDataProvider'
import { Goal, GoalInsert, GoalUpdate } from '@/components/goals/GoalsDataProvider'

interface UseGoalsReturn {
  goals: Goal[]
  activeGoal: Goal | null
  loading: boolean
  error: string | null
  createGoal: (goal: Omit<GoalInsert, 'user_id'>) => Promise<Goal | null>
  updateGoal: (id: string, updates: GoalUpdate) => Promise<Goal | null>
  deleteGoal: (id: string) => Promise<boolean>
  completeGoal: (id: string) => Promise<boolean>
  setGoalActive: (id: string) => Promise<boolean>
  refetch: () => Promise<void>
}

// Legacy hook that wraps the new context for backwards compatibility
export function useGoals(): UseGoalsReturn {
  const {
    goals,
    activeGoal,
    goalsLoading,
    goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refreshGoals,
  } = useAppData()

  return {
    goals,
    activeGoal,
    loading: goalsLoading,
    error: goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refetch: refreshGoals,
  }
}

// Re-export types for backward compatibility
export type { Goal, GoalInsert, GoalUpdate }