export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      demo_group_members: {
        Row: {
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_matches: {
        Row: {
          api_fixture_id: number
          away_score: number | null
          away_team: string
          away_team_logo: string | null
          city: string | null
          home_score: number | null
          home_team: string
          home_team_logo: string | null
          id: string
          jornada: number | null
          kickoff_utc: string
          last_synced_at: string | null
          stadium: string | null
          status: string
        }
        Insert: {
          api_fixture_id?: number
          away_score?: number | null
          away_team: string
          away_team_logo?: string | null
          city?: string | null
          home_score?: number | null
          home_team: string
          home_team_logo?: string | null
          id?: string
          jornada?: number | null
          kickoff_utc: string
          last_synced_at?: string | null
          stadium?: string | null
          status?: string
        }
        Update: {
          api_fixture_id?: number
          away_score?: number | null
          away_team?: string
          away_team_logo?: string | null
          city?: string | null
          home_score?: number | null
          home_team?: string
          home_team_logo?: string | null
          id?: string
          jornada?: number | null
          kickoff_utc?: string
          last_synced_at?: string | null
          stadium?: string | null
          status?: string
        }
        Relationships: []
      }
      demo_predictions: {
        Row: {
          demo_match_id: string
          id: string
          points_awarded: number | null
          predicted_away_score: number
          predicted_home_score: number
          submitted_at: string
          user_id: string
        }
        Insert: {
          demo_match_id: string
          id?: string
          points_awarded?: number | null
          predicted_away_score?: number
          predicted_home_score?: number
          submitted_at?: string
          user_id: string
        }
        Update: {
          demo_match_id?: string
          id?: string
          points_awarded?: number | null
          predicted_away_score?: number
          predicted_home_score?: number
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_predictions_demo_match_id_fkey"
            columns: ["demo_match_id"]
            isOneToOne: false
            referencedRelation: "demo_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_discovery"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          access_code: string | null
          admin_user_id: string
          created_at: string
          description: string | null
          id: string
          invite_code: string | null
          max_members: number
          name: string
          stripe_payment_id: string | null
          tier: Database["public"]["Enums"]["group_tier"]
        }
        Insert: {
          access_code?: string | null
          admin_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          max_members?: number
          name: string
          stripe_payment_id?: string | null
          tier?: Database["public"]["Enums"]["group_tier"]
        }
        Update: {
          access_code?: string | null
          admin_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          max_members?: number
          name?: string
          stripe_payment_id?: string | null
          tier?: Database["public"]["Enums"]["group_tier"]
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_flag: string | null
          away_score: number | null
          away_team: string
          city: string
          created_at: string
          group_label: string | null
          home_flag: string | null
          home_score: number | null
          home_team: string
          id: string
          kickoff_utc: string
          match_number: number
          stadium: string
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          away_flag?: string | null
          away_score?: number | null
          away_team: string
          city?: string
          created_at?: string
          group_label?: string | null
          home_flag?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          kickoff_utc: string
          match_number: number
          stadium?: string
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          away_flag?: string | null
          away_score?: number | null
          away_team?: string
          city?: string
          created_at?: string
          group_label?: string | null
          home_flag?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          kickoff_utc?: string
          match_number?: number
          stadium?: string
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          match_id: string
          points_awarded: number | null
          predicted_away_score: number
          predicted_home_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          match_id: string
          points_awarded?: number | null
          predicted_away_score?: number
          predicted_home_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          match_id?: string
          points_awarded?: number | null
          predicted_away_score?: number
          predicted_home_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups_discovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      groups_discovery: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          description: string | null
          has_access_code: boolean | null
          id: string | null
          max_members: number | null
          name: string | null
          tier: Database["public"]["Enums"]["group_tier"] | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          description?: string | null
          has_access_code?: never
          id?: string | null
          max_members?: number | null
          name?: string | null
          tier?: Database["public"]["Enums"]["group_tier"] | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          description?: string | null
          has_access_code?: never
          id?: string | null
          max_members?: number | null
          name?: string | null
          tier?: Database["public"]["Enums"]["group_tier"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_group_admin: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      validate_group_access_code: {
        Args: { _code: string; _group_id: string }
        Returns: boolean
      }
    }
    Enums: {
      group_tier: "basico" | "familiar" | "grande"
      match_stage:
        | "group"
        | "round_of_32"
        | "round_of_16"
        | "quarterfinal"
        | "semifinal"
        | "third_place"
        | "final"
      match_status: "upcoming" | "live" | "finished"
      member_status: "pending" | "approved" | "rejected" | "removed"
      notification_type:
        | "join_request"
        | "join_approved"
        | "join_rejected"
        | "match_scored"
        | "prediction_reminder"
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
  public: {
    Enums: {
      group_tier: ["basico", "familiar", "grande"],
      match_stage: [
        "group",
        "round_of_32",
        "round_of_16",
        "quarterfinal",
        "semifinal",
        "third_place",
        "final",
      ],
      match_status: ["upcoming", "live", "finished"],
      member_status: ["pending", "approved", "rejected", "removed"],
      notification_type: [
        "join_request",
        "join_approved",
        "join_rejected",
        "match_scored",
        "prediction_reminder",
      ],
    },
  },
} as const
