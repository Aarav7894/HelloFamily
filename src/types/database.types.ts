export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_in_date: string;
          concern_detected: boolean | null;
          feeling: Database["public"]["Enums"]["feeling_answer"];
          id: string;
          normal_activities: Database["public"]["Enums"]["wellness_answer"];
          older_adult_id: string;
          physically_okay: Database["public"]["Enums"]["wellness_answer"];
          submitted_at: string;
        };
        Insert: {
          check_in_date: string;
          concern_detected?: boolean | null;
          feeling: Database["public"]["Enums"]["feeling_answer"];
          id?: string;
          normal_activities: Database["public"]["Enums"]["wellness_answer"];
          older_adult_id: string;
          physically_okay: Database["public"]["Enums"]["wellness_answer"];
          submitted_at?: string;
        };
        Update: {
          check_in_date?: string;
          concern_detected?: boolean | null;
          feeling?: Database["public"]["Enums"]["feeling_answer"];
          id?: string;
          normal_activities?: Database["public"]["Enums"]["wellness_answer"];
          older_adult_id?: string;
          physically_okay?: Database["public"]["Enums"]["wellness_answer"];
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_older_adult_id_fkey";
            columns: ["older_adult_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_statuses: {
        Row: {
          check_in_id: string | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          older_adult_id: string;
          status: Database["public"]["Enums"]["checkin_status"];
          status_date: string;
        };
        Insert: {
          check_in_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          older_adult_id: string;
          status: Database["public"]["Enums"]["checkin_status"];
          status_date: string;
        };
        Update: {
          check_in_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          older_adult_id?: string;
          status?: Database["public"]["Enums"]["checkin_status"];
          status_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_statuses_check_in_id_fkey";
            columns: ["check_in_id"];
            isOneToOne: true;
            referencedRelation: "check_ins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daily_statuses_older_adult_id_fkey";
            columns: ["older_adult_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      family_connections: {
        Row: {
          adult_child_id: string;
          connected_at: string;
          id: string;
          older_adult_id: string;
          revoked_at: string | null;
          status: Database["public"]["Enums"]["connection_status"];
        };
        Insert: {
          adult_child_id: string;
          connected_at?: string;
          id?: string;
          older_adult_id: string;
          revoked_at?: string | null;
          status?: Database["public"]["Enums"]["connection_status"];
        };
        Update: {
          adult_child_id?: string;
          connected_at?: string;
          id?: string;
          older_adult_id?: string;
          revoked_at?: string | null;
          status?: Database["public"]["Enums"]["connection_status"];
        };
        Relationships: [
          {
            foreignKeyName: "family_connections_adult_child_id_fkey";
            columns: ["adult_child_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "family_connections_older_adult_id_fkey";
            columns: ["older_adult_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          contact: string | null;
          created_at: string;
          created_by: string;
          expires_at: string;
          id: string;
          status: Database["public"]["Enums"]["invite_status"];
          token_hash: string;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          contact?: string | null;
          created_at?: string;
          created_by: string;
          expires_at: string;
          id?: string;
          status?: Database["public"]["Enums"]["invite_status"];
          token_hash: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          contact?: string | null;
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["invite_status"];
          token_hash?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_used_by_fkey";
            columns: ["used_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          completed_alert_enabled: boolean;
          concern_alert_enabled: boolean;
          daily_reminder_enabled: boolean;
          daily_reminder_time: string;
          missed_alert_enabled: boolean;
          missed_check_in_cutoff: string;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_alert_enabled?: boolean;
          concern_alert_enabled?: boolean;
          daily_reminder_enabled?: boolean;
          daily_reminder_time?: string;
          missed_alert_enabled?: boolean;
          missed_check_in_cutoff?: string;
          timezone?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_alert_enabled?: boolean;
          concern_alert_enabled?: boolean;
          daily_reminder_enabled?: boolean;
          daily_reminder_time?: string;
          missed_alert_enabled?: boolean;
          missed_check_in_cutoff?: string;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone_number: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone_number?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone_number?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          active: boolean;
          created_at: string;
          expo_push_token: string;
          id: string;
          platform: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          expo_push_token: string;
          id?: string;
          platform?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          expo_push_token?: string;
          id?: string;
          platform?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_invite: {
        Args: { p_contact?: string };
        Returns: {
          expires_at: string;
          invite_id: string;
          token: string;
        }[];
      };
      redeem_invite: {
        Args: { p_token: string };
        Returns: {
          adult_child_id: string;
        }[];
      };
    };
    Enums: {
      checkin_status: "completed" | "concern" | "missed";
      connection_status: "active" | "revoked";
      feeling_answer: "good" | "okay" | "not_good";
      invite_status: "pending" | "accepted" | "expired" | "revoked";
      user_role: "adult_child" | "older_adult";
      wellness_answer: "yes" | "mostly" | "no";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      checkin_status: ["completed", "concern", "missed"],
      connection_status: ["active", "revoked"],
      feeling_answer: ["good", "okay", "not_good"],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      user_role: ["adult_child", "older_adult"],
      wellness_answer: ["yes", "mostly", "no"],
    },
  },
} as const;
