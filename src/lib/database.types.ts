
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      calorie_calculations: {
        Row: {
          activity_multiplier: number
          age: number
          bmr: number
          calculation_date: string
          created_at: string | null
          id: string
          tdee: number
          updated_at: string | null
          user_id: string
          weight_lbs: number
        }
        Insert: {
          activity_multiplier: number
          age: number
          bmr: number
          calculation_date?: string
          created_at?: string | null
          id?: string
          tdee: number
          updated_at?: string | null
          user_id: string
          weight_lbs: number
        }
        Update: {
          activity_multiplier?: number
          age?: number
          bmr?: number
          calculation_date?: string
          created_at?: string | null
          id?: string
          tdee?: number
          updated_at?: string | null
          user_id?: string
          weight_lbs?: number
        }
        Relationships: [
          {
            foreignKeyName: "calorie_calculations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_targets: {
        Row: {
          created_at: string | null
          goal_id: string
          id: string
          recommended_calories: number
          recommended_carbs: number
          recommended_fat: number
          recommended_protein: number
          target_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          goal_id: string
          id?: string
          recommended_calories: number
          recommended_carbs: number
          recommended_fat: number
          recommended_protein: number
          target_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          goal_id?: string
          id?: string
          recommended_calories?: number
          recommended_carbs?: number
          recommended_fat?: number
          recommended_protein?: number
          target_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_targets_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      day_exercises: {
        Row: {
          created_at: string | null
          day_id: string | null
          exercise_id: string | null
          id: string
          order_index: number
        }
        Insert: {
          created_at?: string | null
          day_id?: string | null
          exercise_id?: string | null
          id?: string
          order_index: number
        }
        Update: {
          created_at?: string | null
          day_id?: string | null
          exercise_id?: string | null
          id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "day_exercises_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "mesocycle_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "day_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          created_at: string | null
          exercise_id: string | null
          id: string
          order_index: number
          replaced_original: boolean | null
          was_accessory: boolean | null
          workout_log_id: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          order_index: number
          replaced_original?: boolean | null
          was_accessory?: boolean | null
          workout_log_id?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string | null
          id?: string
          order_index?: number
          replaced_original?: boolean | null
          was_accessory?: boolean | null
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          equipment: string | null
          id: string
          name: string
          notes: string | null
          primary_muscle_group: string
          secondary_muscle_groups: string[] | null
          updated_at: string | null
          use_rir_rpe: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          equipment?: string | null
          id?: string
          name: string
          notes?: string | null
          primary_muscle_group: string
          secondary_muscle_groups?: string[] | null
          updated_at?: string | null
          use_rir_rpe?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          equipment?: string | null
          id?: string
          name?: string
          notes?: string | null
          primary_muscle_group?: string
          secondary_muscle_groups?: string[] | null
          updated_at?: string | null
          use_rir_rpe?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          created_at: string | null
          food_id: string | null
          id: string
          logged_at: string
          logged_date: string
          quantity: number
          unit: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          logged_at: string
          logged_date: string
          quantity: number
          unit: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          logged_at?: string
          logged_date?: string
          quantity?: number
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          brand_name: string | null
          calories_per_100g: number | null
          carbs_per_100g: number | null
          created_at: string | null
          description: string
          fat_per_100g: number | null
          fdc_id: number | null
          fiber_per_100g: number | null
          id: string
          protein_per_100g: number | null
          serving_size: number | null
          serving_unit: string | null
          sodium_per_100g: number | null
          sugar_per_100g: number | null
          updated_at: string | null
        }
        Insert: {
          brand_name?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          description: string
          fat_per_100g?: number | null
          fdc_id?: number | null
          fiber_per_100g?: number | null
          id?: string
          protein_per_100g?: number | null
          serving_size?: number | null
          serving_unit?: string | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_name?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          description?: string
          fat_per_100g?: number | null
          fdc_id?: number | null
          fiber_per_100g?: number | null
          id?: string
          protein_per_100g?: number | null
          serving_size?: number | null
          serving_unit?: string | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_weeks: number
          end_date: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          rate_type: string | null
          start_date: string
          start_weight: number
          surplus_calories: number | null
          target_rate_lbs: number | null
          target_rate_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_weeks: number
          end_date?: string | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          rate_type?: string | null
          start_date?: string
          start_weight: number
          surplus_calories?: number | null
          target_rate_lbs?: number | null
          target_rate_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_weeks?: number
          end_date?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          rate_type?: string | null
          start_date?: string
          start_weight?: number
          surplus_calories?: number | null
          target_rate_lbs?: number | null
          target_rate_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mesocycle_days: {
        Row: {
          created_at: string | null
          day_number: number
          id: string
          mesocycle_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_number: number
          id?: string
          mesocycle_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number
          id?: string
          mesocycle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mesocycle_days_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
      mesocycles: {
        Row: {
          created_at: string | null
          days_per_week: number
          deleted_at: string | null
          goal_statement: string | null
          id: string
          is_template: boolean | null
          name: string
          specialization: string[] | null
          updated_at: string | null
          user_id: string | null
          weeks: number
        }
        Insert: {
          created_at?: string | null
          days_per_week: number
          deleted_at?: string | null
          goal_statement?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          specialization?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          weeks: number
        }
        Update: {
          created_at?: string | null
          days_per_week?: number
          deleted_at?: string | null
          goal_statement?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          specialization?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          weeks?: number
        }
        Relationships: []
      }
      nutrition_settings: {
        Row: {
          created_at: string | null
          id: string
          logging_end_hour: number | null
          logging_start_hour: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logging_end_hour?: number | null
          logging_start_hour?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logging_end_hour?: number | null
          logging_start_hour?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          biological_sex: string | null
          birth_date: string | null
          created_at: string
          height_inches: number | null
          id: string
          updated_at: string
        }
        Insert: {
          activity_level?: string | null
          biological_sex?: string | null
          birth_date?: string | null
          created_at?: string
          height_inches?: number | null
          id: string
          updated_at?: string
        }
        Update: {
          activity_level?: string | null
          biological_sex?: string | null
          birth_date?: string | null
          created_at?: string
          height_inches?: number | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recent_foods: {
        Row: {
          created_at: string | null
          food_id: string | null
          id: string
          last_used: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          last_used?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          food_id?: string | null
          id?: string
          last_used?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recent_foods_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string | null
          exercise_log_id: string | null
          id: string
          reps: number
          rir: number | null
          rpe: number | null
          set_number: number
          weight: number
        }
        Insert: {
          created_at?: string | null
          exercise_log_id?: string | null
          id?: string
          reps: number
          rir?: number | null
          rpe?: number | null
          set_number: number
          weight: number
        }
        Update: {
          created_at?: string | null
          exercise_log_id?: string | null
          id?: string
          reps?: number
          rir?: number | null
          rpe?: number | null
          set_number?: number
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_exercise_log_id_fkey"
            columns: ["exercise_log_id"]
            isOneToOne: false
            referencedRelation: "exercise_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          notes: string | null
          user_id: string
          weight_lbs: number
        }
        Insert: {
          created_at?: string
          entry_date: string
          id?: string
          notes?: string | null
          user_id: string
          weight_lbs: number
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight_lbs?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          custom_goal_entry: string | null
          day_number: number | null
          id: string
          mesocycle_id: string | null
          started_at: string | null
          user_id: string | null
          week_number: number | null
          workout_date: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          custom_goal_entry?: string | null
          day_number?: number | null
          id?: string
          mesocycle_id?: string | null
          started_at?: string | null
          user_id?: string | null
          week_number?: number | null
          workout_date?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          custom_goal_entry?: string | null
          day_number?: number | null
          id?: string
          mesocycle_id?: string | null
          started_at?: string | null
          user_id?: string | null
          week_number?: number | null
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_mesocycle_id_fkey"
            columns: ["mesocycle_id"]
            isOneToOne: false
            referencedRelation: "mesocycles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_recent_food_use_count: {
        Args: { p_user_id: string; p_food_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
