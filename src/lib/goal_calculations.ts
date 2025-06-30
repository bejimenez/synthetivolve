// src/lib/goal_calculations.ts
import type { Database } from './database.types'
import { startOfWeek, addWeeks, parseISO, isAfter, isBefore, format } from 'date-fns'

type Goal = Database['public']['Tables']['goals']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export interface CalorieAdjustment {
  adjustedCalories: number
  adjustmentReason: string
  warnings: string[]
}

export interface GoalProgress {
  daysElapsed: number
  daysRemaining: number
  totalDays: number
  progressPercent: number
  expectedWeightChange: number
  currentWeightChange: number | null
  onTrack: boolean | null
  weeklyProgress?: WeeklyProgress[]
}

export interface WeeklyProgress {
  weekNumber: number
  weekLabel: string
  expectedWeight: number
  actualWeight?: number
  variance?: number
  isCurrentWeek: boolean
}

/**
 * Calculate adjusted calories based on goal type and parameters
 */
export function calculateGoalCalories(
  baseCalories: number,
  currentWeight: number,
  goal: Goal
): CalorieAdjustment {
  const warnings: string[] = []
  let adjustedCalories = baseCalories
  let adjustmentReason = 'Maintenance calories'

  switch (goal.goal_type) {
    case 'maintenance':
      // No adjustment needed
      break

    case 'fat_loss': {
      let weeklyDeficit = 0
      
      if (goal.rate_type === 'absolute' && goal.target_rate_lbs) {
        weeklyDeficit = goal.target_rate_lbs * 3500 // 3500 calories per pound
        adjustmentReason = `${goal.target_rate_lbs} lbs/week target`
        
        // Safety warnings
        if (goal.target_rate_lbs > 2) {
          warnings.push('Weight loss rate above 2 lbs/week may be unsustainable')
        }
      } else if (goal.rate_type === 'percentage' && goal.target_rate_percent) {
        const weeklyLossLbs = (currentWeight * goal.target_rate_percent) / 100
        weeklyDeficit = weeklyLossLbs * 3500
        adjustmentReason = `${goal.target_rate_percent}% bodyweight/week target`
        
        // Safety warnings
        if (goal.target_rate_percent > 1.5) {
          warnings.push('Weight loss rate above 1.5% bodyweight/week may be unsustainable')
        }
      }

      const dailyDeficit = weeklyDeficit / 7
      adjustedCalories = baseCalories - dailyDeficit
      
      // Apply 1100 calorie floor
      if (adjustedCalories < 1100) {
        adjustedCalories = 1100
        warnings.push('Calories adjusted to 1100 minimum for safety - this may result in slower weight loss')
        adjustmentReason += ' (limited by safety floor)'
      }
      break
    }

    case 'muscle_gain': {
      const surplusCalories = goal.surplus_calories || 300
      adjustedCalories = baseCalories + surplusCalories
      adjustmentReason = `${surplusCalories} calorie surplus for muscle gain`
      
      if (surplusCalories > 500) {
        warnings.push('Large calorie surplus may result in more fat gain than muscle gain')
      }
      break
    }
  }

  return {
    adjustedCalories: Math.round(adjustedCalories),
    adjustmentReason,
    warnings
  }
}

/**
 * Calculate macro distribution for goal-adjusted calories
 */
export function calculateGoalMacros(
  adjustedCalories: number,
  currentWeight: number
) {
  // Protein: 1g per lb body weight (non-negotiable)
  const protein = currentWeight
  
  // Fat: minimum 50g per day
  const fat = Math.max(50, currentWeight * 0.25)
  
  // Calculate calories from protein and fat
  const proteinCalories = protein * 4
  const fatCalories = fat * 9
  
  // Remaining calories go to carbs
  const remainingCalories = Math.max(0, adjustedCalories - proteinCalories - fatCalories)
  const carbs = remainingCalories / 4

  return {
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    macroCalories: {
      protein: Math.round(proteinCalories),
      fat: Math.round(fatCalories),
      carbs: Math.round(remainingCalories)
    }
  }
}

/**
 * Calculate goal progress metrics with weekly breakdown
 */
export function calculateGoalProgress(
  goal: Goal,
  currentWeight: number | null,
  weightEntries?: Array<{ weight_lbs: number; entry_date: string }>
): GoalProgress {
  const startDate = new Date(goal.start_date)
  const endDate = new Date(goal.end_date)
  const now = new Date()
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const progressPercent = Math.min(100, (daysElapsed / totalDays) * 100)

  // Calculate expected weight change
  let expectedWeightChange = 0
  if (goal.goal_type === 'fat_loss') {
    const weeksElapsed = daysElapsed / 7
    if (goal.rate_type === 'absolute' && goal.target_rate_lbs) {
      expectedWeightChange = -(goal.target_rate_lbs * weeksElapsed)
    } else if (goal.rate_type === 'percentage' && goal.target_rate_percent) {
      // Simplified calculation - doesn't account for compound effect
      expectedWeightChange = -(goal.start_weight * goal.target_rate_percent * weeksElapsed) / 100
    }
  } else if (goal.goal_type === 'muscle_gain') {
    // Estimate ~0.5 lbs per week muscle gain
    const weeksElapsed = daysElapsed / 7
    expectedWeightChange = 0.5 * weeksElapsed
  }

  // Calculate current weight change
  const currentWeightChange = currentWeight ? currentWeight - goal.start_weight : null
  
  // Determine if on track (within 20% of expected)
  let onTrack: boolean | null = null
  if (currentWeightChange !== null && Math.abs(expectedWeightChange) > 0.1) {
    const variance = Math.abs(currentWeightChange - expectedWeightChange) / Math.abs(expectedWeightChange)
    onTrack = variance <= 0.2
  }

  // Calculate weekly progress if weight entries provided
  let weeklyProgress: WeeklyProgress[] | undefined
  if (weightEntries && weightEntries.length > 0) {
    weeklyProgress = calculateWeeklyProgress(goal, weightEntries)
  }

  return {
    daysElapsed,
    daysRemaining,
    totalDays,
    progressPercent,
    expectedWeightChange,
    currentWeightChange,
    onTrack,
    weeklyProgress
  }
}

/**
 * Calculate weekly progress breakdown for Sunday check-ins
 */
export function calculateWeeklyProgress(
  goal: Goal,
  weightEntries: Array<{ weight_lbs: number; entry_date: string }>
): WeeklyProgress[] {
  const startDate = parseISO(goal.start_date)
  const endDate = parseISO(goal.end_date)
  const now = new Date()

  // Find the first Sunday on or after the goal start date
  const firstSunday = startOfWeek(startDate, { weekStartsOn: 0 })
  const effectiveStartSunday = isBefore(firstSunday, startDate) ? addWeeks(firstSunday, 1) : firstSunday

  // Calculate weekly weight change
  let weeklyWeightChange = 0
  if (goal.goal_type === 'fat_loss') {
    if (goal.rate_type === 'absolute' && goal.target_rate_lbs) {
      weeklyWeightChange = -goal.target_rate_lbs
    } else if (goal.rate_type === 'percentage' && goal.target_rate_percent) {
      weeklyWeightChange = -(goal.start_weight * goal.target_rate_percent) / 100
    }
  } else if (goal.goal_type === 'muscle_gain') {
    weeklyWeightChange = 0.5 // Assume 0.5 lbs per week
  }

  const weeklyProgress: WeeklyProgress[] = []
  let currentSunday = effectiveStartSunday
  let weekNumber = 0

  while (isBefore(currentSunday, endDate) || currentSunday.getTime() === endDate.getTime()) {
    const expectedWeight = goal.start_weight + (weeklyWeightChange * weekNumber)
    const weekLabel = format(currentSunday, 'MMM d')
    const isCurrentWeek = isBefore(currentSunday, addWeeks(now, 1)) && isAfter(currentSunday, addWeeks(now, -1))

    // Find actual weight for this week
    let actualWeight: number | undefined
    if (!isAfter(currentSunday, now)) {
      const weekStart = addWeeks(currentSunday, -1)
      const weekEntries = weightEntries.filter(entry => {
        const entryDate = parseISO(entry.entry_date)
        return isAfter(entryDate, weekStart) && 
               (isBefore(entryDate, currentSunday) || entryDate.getTime() === currentSunday.getTime())
      })

      if (weekEntries.length > 0) {
        const sortedEntries = weekEntries.sort((a, b) => {
          const aDate = parseISO(a.entry_date)
          const bDate = parseISO(b.entry_date)
          const aDiff = Math.abs(currentSunday.getTime() - aDate.getTime())
          const bDiff = Math.abs(currentSunday.getTime() - bDate.getTime())
          return aDiff - bDiff
        })
        actualWeight = sortedEntries[0].weight_lbs
      }
    }

    const variance = actualWeight !== undefined ? actualWeight - expectedWeight : undefined

    weeklyProgress.push({
      weekNumber,
      weekLabel,
      expectedWeight: Math.round(expectedWeight * 10) / 10,
      actualWeight: actualWeight ? Math.round(actualWeight * 10) / 10 : undefined,
      variance: variance ? Math.round(variance * 10) / 10 : undefined,
      isCurrentWeek
    })

    currentSunday = addWeeks(currentSunday, 1)
    weekNumber++
  }

  return weeklyProgress
}

/**
 * Validate goal parameters
 */
export function validateGoalParameters(goalData: {
  goal_type: string
  target_rate_lbs?: number
  target_rate_percent?: number
  rate_type?: string
  duration_weeks: number
  surplus_calories?: number
  currentWeight: number
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Duration validation
  if (goalData.duration_weeks < 2 || goalData.duration_weeks > 16) {
    errors.push('Goal duration must be between 2 and 16 weeks')
  }

  // Fat loss validation
  if (goalData.goal_type === 'fat_loss') {
    if (!goalData.rate_type || (!goalData.target_rate_lbs && !goalData.target_rate_percent)) {
      errors.push('Fat loss goals require a target rate')
    }

    if (goalData.rate_type === 'absolute') {
      if (!goalData.target_rate_lbs || goalData.target_rate_lbs <= 0 || goalData.target_rate_lbs > 3) {
        errors.push('Absolute rate must be between 0.1 and 3.0 lbs per week')
      }
    }

    if (goalData.rate_type === 'percentage') {
      if (!goalData.target_rate_percent || goalData.target_rate_percent <= 0 || goalData.target_rate_percent > 2) {
        errors.push('Percentage rate must be between 0.1% and 2.0% of bodyweight per week')
      }
    }
  }

  // Muscle gain validation
  if (goalData.goal_type === 'muscle_gain') {
    if (goalData.surplus_calories && (goalData.surplus_calories < 100 || goalData.surplus_calories > 1000)) {
      errors.push('Calorie surplus should be between 100 and 1000 calories')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}