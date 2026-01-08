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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          doctor_id: string
          duration: number
          id: string
          notes: string | null
          patient_id: string
          reason: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          doctor_id: string
          duration?: number
          id?: string
          notes?: string | null
          patient_id: string
          reason: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          doctor_id?: string
          duration?: number
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string
          clinic_name: string
          created_at: string | null
          currency: string
          email: string
          id: string
          language: string
          lunch_end: string
          lunch_start: string
          phone: string
          timezone: string
          updated_at: string | null
          website: string | null
          working_days: string[]
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          address?: string
          clinic_name?: string
          created_at?: string | null
          currency?: string
          email?: string
          id?: string
          language?: string
          lunch_end?: string
          lunch_start?: string
          phone?: string
          timezone?: string
          updated_at?: string | null
          website?: string | null
          working_days?: string[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          address?: string
          clinic_name?: string
          created_at?: string | null
          currency?: string
          email?: string
          id?: string
          language?: string
          lunch_end?: string
          lunch_start?: string
          phone?: string
          timezone?: string
          updated_at?: string | null
          website?: string | null
          working_days?: string[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: []
      }
      consultation_workflows: {
        Row: {
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string | null
          created_by: string
          doctor_id: string | null
          id: string
          invoice_id: string
          patient_id: string
          status: string
          updated_at: string | null
          vital_signs_id: string | null
        }
        Insert: {
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          created_by: string
          doctor_id?: string | null
          id?: string
          invoice_id: string
          patient_id: string
          status?: string
          updated_at?: string | null
          vital_signs_id?: string | null
        }
        Update: {
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string | null
          created_by?: string
          doctor_id?: string | null
          id?: string
          invoice_id?: string
          patient_id?: string
          status?: string
          updated_at?: string | null
          vital_signs_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_workflows_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_workflows_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_workflows_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_workflows_vital_signs_id_fkey"
            columns: ["vital_signs_id"]
            isOneToOne: false
            referencedRelation: "vital_signs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          medical_service_id: string | null
          medicine_id: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          medical_service_id?: string | null
          medicine_id?: string | null
          quantity?: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          medical_service_id?: string | null
          medicine_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_medical_service_id_fkey"
            columns: ["medical_service_id"]
            isOneToOne: false
            referencedRelation: "medical_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          id: string
          invoice_type: Database["public"]["Enums"]["type_facture"] | null
          paid_at: string | null
          patient_id: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number
          tax: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          id: string
          invoice_type?: Database["public"]["Enums"]["type_facture"] | null
          paid_at?: string | null
          patient_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          id?: string
          invoice_type?: Database["public"]["Enums"]["type_facture"] | null
          paid_at?: string | null
          patient_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          appointment_id: string | null
          attachments: string[] | null
          created_at: string | null
          date: string
          diagnosis: string
          doctor_id: string
          id: string
          is_control: boolean
          lab_orders: string | null
          notes: string | null
          parent_consultation_id: string | null
          patient_id: string
          physical_examination: string | null
          previous_treatment: string | null
          reason: string
          symptoms: string | null
          treatment: string | null
          type: Database["public"]["Enums"]["consultation_type"]
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          attachments?: string[] | null
          created_at?: string | null
          date: string
          diagnosis: string
          doctor_id: string
          id?: string
          is_control?: boolean
          lab_orders?: string | null
          notes?: string | null
          parent_consultation_id?: string | null
          patient_id: string
          physical_examination?: string | null
          previous_treatment?: string | null
          reason: string
          symptoms?: string | null
          treatment?: string | null
          type: Database["public"]["Enums"]["consultation_type"]
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          attachments?: string[] | null
          created_at?: string | null
          date?: string
          diagnosis?: string
          doctor_id?: string
          id?: string
          is_control?: boolean
          lab_orders?: string | null
          notes?: string | null
          parent_consultation_id?: string | null
          patient_id?: string
          physical_examination?: string | null
          previous_treatment?: string | null
          reason?: string
          symptoms?: string | null
          treatment?: string | null
          type?: Database["public"]["Enums"]["consultation_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_parent_consultation_id_fkey"
            columns: ["parent_consultation_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_services: {
        Row: {
          base_price: number
          category: string
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          doctor_speciality: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          name: string
          requires_doctor: boolean | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          doctor_speciality?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_doctor?: boolean | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          doctor_speciality?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_doctor?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_services_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          batch_number: string
          category: Database["public"]["Enums"]["medicine_category"]
          created_at: string | null
          created_by: string | null
          current_stock: number
          description: string | null
          expiry_date: string
          id: string
          location: string
          manufacturer: string
          min_stock: number
          name: string
          unit: string
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          category: Database["public"]["Enums"]["medicine_category"]
          created_at?: string | null
          created_by?: string | null
          current_stock?: number
          description?: string | null
          expiry_date: string
          id?: string
          location: string
          manufacturer: string
          min_stock?: number
          name: string
          unit: string
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          category?: Database["public"]["Enums"]["medicine_category"]
          created_at?: string | null
          created_by?: string | null
          current_stock?: number
          description?: string | null
          expiry_date?: string
          id?: string
          location?: string
          manufacturer?: string
          min_stock?: number
          name?: string
          unit?: string
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string
          allergies: string[] | null
          blood_type: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string
          email: string | null
          emergency_contact: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          last_name: string
          medical_history: string[] | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address: string
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          last_name: string
          medical_history?: string[] | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          last_name?: string
          medical_history?: string[] | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string | null
          dosage: string
          duration: string
          frequency: string
          id: string
          instructions: string | null
          medical_record_id: string
          medication: string
        }
        Insert: {
          created_at?: string | null
          dosage: string
          duration: string
          frequency: string
          id?: string
          instructions?: string | null
          medical_record_id: string
          medication: string
        }
        Update: {
          created_at?: string | null
          dosage?: string
          duration?: string
          frequency?: string
          id?: string
          instructions?: string | null
          medical_record_id?: string
          medication?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string | null
          department: string | null
          email: string
          emergency_contact: string | null
          first_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          salary: number | null
          speciality: string | null
          updated_at: string | null
          work_schedule: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          emergency_contact?: string | null
          first_name: string
          hire_date?: string | null
          id: string
          is_active?: boolean | null
          last_name: string
          phone: string
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          speciality?: string | null
          updated_at?: string | null
          work_schedule?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          emergency_contact?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          salary?: number | null
          speciality?: string | null
          updated_at?: string | null
          work_schedule?: string | null
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string
          end_time: string
          id: string
          shift: Database["public"]["Enums"]["schedule_shift"]
          staff_id: string
          start_time: string
          status: Database["public"]["Enums"]["schedule_status"] | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date: string
          end_time: string
          id?: string
          shift: Database["public"]["Enums"]["schedule_shift"]
          staff_id: string
          start_time: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string
          end_time?: string
          id?: string
          shift?: Database["public"]["Enums"]["schedule_shift"]
          staff_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          date: string
          id: string
          medicine_id: string
          quantity: number
          reason: string
          reference: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          medicine_id: string
          quantity: number
          reason: string
          reference?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          medicine_id?: string
          quantity?: number
          reason?: string
          reference?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_sessions: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          medical_record_id: string
          observations: string | null
          patient_id: string
          performed_by: string | null
          performed_date: string | null
          scheduled_date: string
          session_number: number
          status: string
          total_sessions: number | null
          treatment_notes: string | null
          treatment_type: string
          updated_at: string | null
          vital_signs_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          medical_record_id: string
          observations?: string | null
          patient_id: string
          performed_by?: string | null
          performed_date?: string | null
          scheduled_date: string
          session_number?: number
          status?: string
          total_sessions?: number | null
          treatment_notes?: string | null
          treatment_type: string
          updated_at?: string | null
          vital_signs_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          medical_record_id?: string
          observations?: string | null
          patient_id?: string
          performed_by?: string | null
          performed_date?: string | null
          scheduled_date?: string
          session_number?: number
          status?: string
          total_sessions?: number | null
          treatment_notes?: string | null
          treatment_type?: string
          updated_at?: string | null
          vital_signs_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_sessions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_sessions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_sessions_vital_signs_id_fkey"
            columns: ["vital_signs_id"]
            isOneToOne: false
            referencedRelation: "vital_signs"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string | null
          heart_rate: number | null
          height: number | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          patient_id: string
          recorded_at: string | null
          recorded_by: string
          respiratory_rate: number | null
          temperature: number | null
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id: string
          recorded_at?: string | null
          recorded_by: string
          respiratory_rate?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string | null
          heart_rate?: number | null
          height?: number | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          patient_id?: string
          recorded_at?: string | null
          recorded_by?: string
          respiratory_rate?: number | null
          temperature?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no-show"
      consultation_type:
        | "general"
        | "specialist"
        | "emergency"
        | "followup"
        | "preventive"
        | "other"
      gender_type: "M" | "F"
      invoice_status: "pending" | "paid" | "overdue"
      medicine_category:
        | "medication"
        | "medical-supply"
        | "equipment"
        | "consumable"
        | "diagnostic"
      payment_method:
        | "cash"
        | "card"
        | "mobile-money"
        | "bank-transfer"
        | "check"
      schedule_shift: "morning" | "afternoon" | "night" | "full-day"
      schedule_status: "scheduled" | "confirmed" | "completed" | "absent"
      stock_movement_type: "in" | "out"
      type_facture:
        | "ordinary"
        | "general-consultation"
        | "gynecological-consultation"
        | "treatment"
      user_role: "admin" | "doctor" | "secretary" | "nurse"
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
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no-show",
      ],
      consultation_type: [
        "general",
        "specialist",
        "emergency",
        "followup",
        "preventive",
        "other",
      ],
      gender_type: ["M", "F"],
      invoice_status: ["pending", "paid", "overdue"],
      medicine_category: [
        "medication",
        "medical-supply",
        "equipment",
        "consumable",
        "diagnostic",
      ],
      payment_method: [
        "cash",
        "card",
        "mobile-money",
        "bank-transfer",
        "check",
      ],
      schedule_shift: ["morning", "afternoon", "night", "full-day"],
      schedule_status: ["scheduled", "confirmed", "completed", "absent"],
      stock_movement_type: ["in", "out"],
      type_facture: [
        "ordinary",
        "general-consultation",
        "gynecological-consultation",
        "treatment",
      ],
      user_role: ["admin", "doctor", "secretary", "nurse"],
    },
  },
} as const
