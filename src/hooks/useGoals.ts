// src/hooks/useGoals.ts (Updated for backwards compatibility)
import { useGoalsData, Goal, GoalInsert, GoalUpdate } from '@/components/goals/GoalsDataProvider'

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
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refreshGoals,
  } = useGoalsData()

  return {
    goals,
    activeGoal,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    setGoalActive,
    refetch: refreshGoals,
  }
}

// Re-export types for backwards compatibility
export type { Goal, GoalInsert, GoalUpdate }