// src/hooks/useGoals.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createSupabaseClient()

  // Fetch all goals for the user
  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user')
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setGoals(data || [])
      
      // Set active goal
      const active = data?.find(goal => goal.is_active) || null
      setActiveGoal(active)
    } catch (err) {
      console.error('Error fetching goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch goals')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create a new goal
  const createGoal = async (goalData: Omit<GoalInsert, 'user_id'>): Promise<Goal | null> => {
    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Deactivate any existing active goals
      if (activeGoal) {
        await supabase
          .from('goals')
          .update({ is_active: false })
          .eq('id', activeGoal.id)
      }

      const { data, error } = await supabase
        .from('goals')
        .insert([{
          ...goalData,
          user_id: user.id,
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      await fetchGoals()
      return data
    } catch (err) {
      console.error('Error creating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create goal')
      return null
    }
  }

  // Update an existing goal
  const updateGoal = async (id: string, updates: GoalUpdate): Promise<Goal | null> => {
    try {
      setError(null)

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchGoals()
      return data
    } catch (err) {
      console.error('Error updating goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to update goal')
      return null
    }
  }

  // Complete a goal
  const completeGoal = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('goals')
        .update({ 
          is_active: false,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      await fetchGoals()
      return true
    } catch (err) {
      console.error('Error completing goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to complete goal')
      return false
    }
  }

  // Delete a goal
  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchGoals()
      return true
    } catch (err) {
      console.error('Error deleting goal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
      return false
    }
  }

  // Set a goal as active (deactivates others)
  const setGoalActive = async (id: string): Promise<boolean> => {
    try {
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('No authenticated user')
      }

      // Deactivate all goals for this user
      await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // Activate the selected goal
      const { error } = await supabase
        .from('goals')
        .update({ is_active: true })
        .eq('id', id)

      if (error) throw error

      await fetchGoals()
      return true
    } catch (err) {
      console.error('Error setting goal active:', err)
      setError(err instanceof Error ? err.message : 'Failed to activate goal')
      return false
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return {
    goals,
    activeGoal,
    loading,
    error,
    createGoal,
    updateGoal,
    completeGoal,
    deleteGoal,
    setGoalActive,
    refetch: fetchGoals
  }
}