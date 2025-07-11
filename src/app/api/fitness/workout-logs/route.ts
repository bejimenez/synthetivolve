// src/app/api/fitness/workout-logs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const setLogSchema = z.object({
  set_number: z.number().int(),
  weight: z.number(),
  reps: z.number().int(),
  rir: z.number().int().optional().nullable(),
  rpe: z.number().optional().nullable(),
});

const exerciseLogSchema = z.object({
  exercise_id: z.string().uuid(),
  order_index: z.number().int(),
  replaced_original: z.boolean().optional(),
  was_accessory: z.boolean().optional(),
  sets: z.array(setLogSchema),
});

const workoutLogCreateSchema = z.object({
  mesocycle_id: z.string().uuid().optional().nullable(),
  week_number: z.number().int().optional().nullable(),
  day_number: z.number().int().optional().nullable(),
  workout_date: z.string().date(),
  custom_goal_entry: z.string().optional().nullable(),
  exercises: z.array(exerciseLogSchema),
});

export async function GET() {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
        .from('workout_logs')
        .select(`
            *,
            exercise_logs (*,
                set_logs (*)
            )
        `)
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = workoutLogCreateSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: validation.error.flatten() }, { status: 400 })
    }
    
    const { exercises, ...workoutData } = validation.data;

    // 1. Create the main workout log
    const { data: newLog, error: logError } = await supabase
        .from('workout_logs')
        .insert({ ...workoutData, user_id: user.id, completed_at: new Date().toISOString() })
        .select()
        .single();

    if (logError) {
        return NextResponse.json({ error: `Failed to create workout log: ${logError.message}` }, { status: 500 });
    }

    // 2. Create the exercise logs and their sets
    for (const exercise of exercises) {
        const { sets, ...exerciseLogData } = exercise;
        const { data: newExerciseLog, error: exerciseLogError } = await supabase
            .from('exercise_logs')
            .insert({ ...exerciseLogData, workout_log_id: newLog.id })
            .select()
            .single();

        if (exerciseLogError) {
            await supabase.from('workout_logs').delete().eq('id', newLog.id); // Cleanup
            return NextResponse.json({ error: `Failed to create exercise log: ${exerciseLogError.message}` }, { status: 500 });
        }

        // 3. Create the set logs
        if (sets.length > 0) {
            const setLogsData = sets.map(set => ({
                ...set,
                exercise_log_id: newExerciseLog.id,
            }));

            const { error: setsError } = await supabase
                .from('set_logs')
                .insert(setLogsData);

            if (setsError) {
                await supabase.from('workout_logs').delete().eq('id', newLog.id); // Cleanup
                return NextResponse.json({ error: `Failed to create sets: ${setsError.message}` }, { status: 500 });
            }
        }
    }

    return NextResponse.json(newLog, { status: 201 });
}