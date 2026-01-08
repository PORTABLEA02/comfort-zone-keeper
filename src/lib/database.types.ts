export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'admin' | 'doctor' | 'secretary' | 'nurse'
          speciality: string | null
          phone: string
          department: string | null
          hire_date: string | null
          salary: number | null
          work_schedule: string | null
          emergency_contact: string | null
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role?: 'admin' | 'doctor' | 'secretary' | 'nurse'
          speciality?: string | null
          phone: string
          department?: string | null
          hire_date?: string | null
          salary?: number | null
          work_schedule?: string | null
          emergency_contact?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'doctor' | 'secretary' | 'nurse'
          speciality?: string | null
          phone?: string
          department?: string | null
          hire_date?: string | null
          salary?: number | null
          work_schedule?: string | null
          emergency_contact?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          date_of_birth: string
          gender: 'M' | 'F'
          phone: string
          email: string | null
          address: string
          emergency_contact: string
          blood_type: string | null
          allergies: string[]
          medical_history: string[] | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          date_of_birth: string
          gender: 'M' | 'F'
          phone: string
          email?: string | null
          address: string
          emergency_contact: string
          blood_type?: string | null
          allergies?: string[]
          medical_history?: string[] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          gender?: 'M' | 'F'
          phone?: string
          email?: string | null
          address?: string
          emergency_contact?: string
          blood_type?: string | null
          allergies?: string[]
          medical_history?: string[] | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          date: string
          time: string
          duration: number
          reason: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          date: string
          time: string
          duration?: number
          reason: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          date?: string
          time?: string
          duration?: number
          reason?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          appointment_id: string | null
          date: string
          type: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other'
          reason: string
          symptoms: string | null
          diagnosis: string
          treatment: string | null
          notes: string | null
          attachments: string[]
          created_at: string
          updated_at: string
          parent_consultation_id: string | null
          is_control: boolean
          previous_treatment: string | null
          physical_examination: string | null
          lab_orders: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          appointment_id?: string | null
          date: string
          type: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other'
          reason: string
          symptoms?: string | null
          diagnosis: string
          treatment?: string | null
          notes?: string | null
          attachments?: string[]
          created_at?: string
          updated_at?: string
          parent_consultation_id?: string | null
          is_control?: boolean
          previous_treatment?: string | null
          physical_examination?: string | null
          lab_orders?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          appointment_id?: string | null
          date?: string
          type?: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other'
          reason?: string
          symptoms?: string | null
          diagnosis?: string
          treatment?: string | null
          notes?: string | null
          attachments?: string[]
          created_at?: string
          updated_at?: string
          parent_consultation_id?: string | null
          is_control?: boolean
          previous_treatment?: string | null
          physical_examination?: string | null
          lab_orders?: string | null
        }
      }
      prescriptions: {
        Row: {
          id: string
          medical_record_id: string
          medication: string
          dosage: string
          frequency: string
          duration: string
          instructions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          medical_record_id: string
          medication: string
          dosage: string
          frequency: string
          duration: string
          instructions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          medical_record_id?: string
          medication?: string
          dosage?: string
          frequency?: string
          duration?: string
          instructions?: string | null
          created_at?: string
        }
      }
      medicines: {
        Row: {
          id: string
          name: string
          category: 'medication' | 'medical-supply' | 'equipment' | 'consumable' | 'diagnostic'
          manufacturer: string
          batch_number: string
          expiry_date: string
          current_stock: number
          min_stock: number
          unit_price: number
          location: string
          unit: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          category: 'medication' | 'medical-supply' | 'equipment' | 'consumable' | 'diagnostic'
          manufacturer: string
          batch_number: string
          expiry_date: string
          current_stock?: number
          min_stock?: number
          unit_price: number
          location: string
          unit: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: 'medication' | 'medical-supply' | 'equipment' | 'consumable' | 'diagnostic'
          manufacturer?: string
          batch_number?: string
          expiry_date?: string
          current_stock?: number
          min_stock?: number
          unit_price?: number
          location?: string
          unit?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      stock_movements: {
        Row: {
          id: string
          medicine_id: string
          type: 'in' | 'out'
          quantity: number
          reason: string
          reference: string | null
          date: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          medicine_id: string
          type: 'in' | 'out'
          quantity: number
          reason: string
          reference?: string | null
          date?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          medicine_id?: string
          type?: 'in' | 'out'
          quantity?: number
          reason?: string
          reference?: string | null
          date?: string
          user_id?: string
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          patient_id: string
          date: string
          subtotal: number
          tax: number
          total: number
          status: 'pending' | 'paid' | 'overdue' | null
          payment_method: 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check' | null
          paid_at: string | null
          invoice_type: 'ordinary' | 'general-consultation' | 'gynecological-consultation' | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          date: string
          subtotal?: number
          tax?: number
          total?: number
          status?: 'pending' | 'paid' | 'overdue' | null
          payment_method?: 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check' | null
          paid_at?: string | null
          invoice_type?: 'ordinary' | 'general-consultation' | 'gynecological-consultation' | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          date?: string
          subtotal?: number
          tax?: number
          total?: number
          status?: 'pending' | 'paid' | 'overdue' | null
          payment_method?: 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check' | null
          paid_at?: string | null
          invoice_type?: 'ordinary' | 'general-consultation' | 'gynecological-consultation' | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          total: number
          medicine_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity?: number
          unit_price: number
          total: number
          medicine_id?: string | null
          created_at?: string
          medical_service_id?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total?: number
          medicine_id?: string | null
          created_at?: string
          medical_service_id?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          payment_method: 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check'
          payment_date: string
          reference: string | null
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          amount: number
          payment_method: 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check'
          payment_date: string
          reference?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          amount?: number
          payment_method?: 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check'
          payment_date?: string
          reference?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      staff_schedules: {
        Row: {
          id: string
          staff_id: string
          date: string
          start_time: string
          end_time: string
          shift: 'morning' | 'afternoon' | 'night' | 'full-day'
          status: 'scheduled' | 'confirmed' | 'completed' | 'absent'
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          date: string
          start_time: string
          end_time: string
          shift: 'morning' | 'afternoon' | 'night' | 'full-day'
          status?: 'scheduled' | 'confirmed' | 'completed' | 'absent'
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          start_time?: string
          end_time?: string
          shift?: 'morning' | 'afternoon' | 'night' | 'full-day'
          status?: 'scheduled' | 'confirmed' | 'completed' | 'absent'
          created_at?: string
          created_by?: string | null
        }
      }
      medical_services: {
      Row: {
        id: string
        name: string
        description: string | null
        category: 'consultation' | 'examination' | 'analysis' | 'procedure' | 'emergency' | 'preventive' | 'other'
        base_price: number
        duration: number
        department: string | null
        requires_doctor: boolean
        doctor_speciality: string | null
        is_active: boolean
        created_at: string
        updated_at: string
        created_by: string | null
      }
      Insert: {
        id?: string
        name: string
        description?: string | null
        category?: 'consultation' | 'examination' | 'analysis' | 'procedure' | 'emergency' | 'preventive' | 'other'
        base_price?: number
        duration?: number
        department?: string | null
        requires_doctor?: boolean
        doctor_speciality?: string | null
        is_active?: boolean
        created_at?: string
        updated_at?: string
        created_by?: string | null
      }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'consultation' | 'examination' | 'analysis' | 'procedure' | 'emergency' | 'preventive' | 'other'
          base_price?: number
          duration?: number
          department?: string | null
          requires_doctor?: boolean
          doctor_speciality?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      vital_signs: {
      Row: {
        id: string
        patient_id: string
        temperature: number | null
        blood_pressure_systolic: number | null
        blood_pressure_diastolic: number | null
        heart_rate: number | null
        weight: number | null
        height: number | null
        oxygen_saturation: number | null
        respiratory_rate: number | null
        notes: string | null
        recorded_at: string
        recorded_by: string
        created_at: string
      }
      Insert: {
        id?: string
        patient_id: string
        temperature?: number | null
        blood_pressure_systolic?: number | null
        blood_pressure_diastolic?: number | null
        heart_rate?: number | null
        weight?: number | null
        height?: number | null
        oxygen_saturation?: number | null
        respiratory_rate?: number | null
        notes?: string | null
        recorded_at?: string
        recorded_by: string
        created_at?: string
      }
        Update: {
          id?: string
          patient_id?: string
          temperature?: number | null
          blood_pressure_systolic?: number | null
          blood_pressure_diastolic?: number | null
          heart_rate?: number | null
          weight?: number | null
          height?: number | null
          oxygen_saturation?: number | null
          respiratory_rate?: number | null
          notes?: string | null
          recorded_at?: string
          recorded_by?: string
          created_at?: string
        }
      }
      consultation_workflows: {
      Row: {
        id: string
        patient_id: string
        invoice_id: string
        vital_signs_id: string | null
        doctor_id: string | null
        consultation_type: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other'
        status: 'payment-pending' | 'payment-completed' | 'vitals-pending' | 'doctor-assignment' | 'consultation-ready' | 'in-progress' | 'completed'
        created_at: string
        updated_at: string
        created_by: string
      }
      Insert: {
        id?: string
        patient_id: string
        invoice_id: string
        vital_signs_id?: string | null
        doctor_id?: string | null
        consultation_type: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other'
        status?: 'payment-pending' | 'payment-completed' | 'vitals-pending' | 'doctor-assignment' | 'consultation-ready' | 'in-progress' | 'completed'
        created_at?: string
        updated_at?: string
        created_by: string
      }
        Update: {
          id?: string
          patient_id?: string
          invoice_id?: string
          vital_signs_id?: string | null
          doctor_id?: string | null
          consultation_type?: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other'
          status?: 'payment-pending' | 'payment-completed' | 'vitals-pending' | 'doctor-assignment' | 'consultation-ready' | 'in-progress' | 'completed'
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      clinic_settings: {
      Row: {
        id: string
        clinic_name: string
        address: string
        phone: string
        email: string
        website: string | null
        timezone: string
        language: string
        currency: string
        working_hours_start: string
        working_hours_end: string
        lunch_start: string
        lunch_end: string
        working_days: string[]
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        clinic_name: string
        address: string
        phone: string
        email: string
        website?: string | null
        timezone?: string
        language?: string
        currency?: string
        working_hours_start?: string
        working_hours_end?: string
        lunch_start?: string
        lunch_end?: string
        working_days?: string[]
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        clinic_name?: string
        address?: string
        phone?: string
        email?: string
        website?: string | null
        timezone?: string
        language?: string
        currency?: string
        working_hours_start?: string
        working_hours_end?: string
        lunch_start?: string
        lunch_end?: string
          working_days?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'doctor' | 'secretary'
      gender_type: 'M' | 'F'
      appointment_status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
      consultation_type: 'general' | 'specialist' | 'emergency' | 'followup' | 'preventive' | 'other'
      medicine_category: 'medication' | 'medical-supply' | 'equipment' | 'consumable' | 'diagnostic'
      stock_movement_type: 'in' | 'out'
      invoice_status: 'pending' | 'paid' | 'overdue'
      medical_service_category: 'consultation' | 'examination' | 'analysis' | 'procedure' | 'emergency' | 'preventive' | 'other'
      payment_method: 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check'
      schedule_shift: 'morning' | 'afternoon' | 'night' | 'full-day'
      schedule_status: 'scheduled' | 'confirmed' | 'completed' | 'absent'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}