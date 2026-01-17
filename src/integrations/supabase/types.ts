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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_number: string
          account_type: string
          agency: string
          bank_name: string
          created_at: string
          id: string
          pix_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          agency: string
          bank_name: string
          created_at?: string
          id?: string
          pix_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          agency?: string
          bank_name?: string
          created_at?: string
          id?: string
          pix_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      loan_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          loan_request_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          loan_request_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          loan_request_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_documents_loan_request_id_fkey"
            columns: ["loan_request_id"]
            isOneToOne: false
            referencedRelation: "loan_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          late_fee: number | null
          loan_request_id: string
          paid_amount: number | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          late_fee?: number | null
          loan_request_id: string
          paid_amount?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          late_fee?: number | null
          loan_request_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_request_id_fkey"
            columns: ["loan_request_id"]
            isOneToOne: false
            referencedRelation: "loan_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_references: {
        Row: {
          created_at: string
          id: string
          loan_request_id: string
          name: string
          phone: string
          relationship: string
        }
        Insert: {
          created_at?: string
          id?: string
          loan_request_id: string
          name: string
          phone: string
          relationship: string
        }
        Update: {
          created_at?: string
          id?: string
          loan_request_id?: string
          name?: string
          phone?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_references_loan_request_id_fkey"
            columns: ["loan_request_id"]
            isOneToOne: false
            referencedRelation: "loan_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          disbursed_at: string | null
          id: string
          interest_rate: number
          monthly_payment: number
          purpose: string | null
          request_location: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          disbursed_at?: string | null
          id?: string
          interest_rate: number
          monthly_payment: number
          purpose?: string | null
          request_location?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          disbursed_at?: string | null
          id?: string
          interest_rate?: number
          monthly_payment?: number
          purpose?: string | null
          request_location?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          cpf: string
          created_at: string
          email: string
          employer: string | null
          full_name: string
          id: string
          monthly_income: number | null
          occupation: string | null
          phone: string
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cpf: string
          created_at?: string
          email: string
          employer?: string | null
          full_name: string
          id?: string
          monthly_income?: number | null
          occupation?: string | null
          phone: string
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cpf?: string
          created_at?: string
          email?: string
          employer?: string | null
          full_name?: string
          id?: string
          monthly_income?: number | null
          occupation?: string | null
          phone?: string
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
      loan_status:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "disbursed"
        | "completed"
      payment_status: "pending" | "paid" | "overdue"
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
      app_role: ["admin", "client"],
      loan_status: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "disbursed",
        "completed",
      ],
      payment_status: ["pending", "paid", "overdue"],
    },
  },
} as const
