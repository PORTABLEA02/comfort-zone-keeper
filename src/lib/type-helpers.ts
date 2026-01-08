// Helper functions to convert database types to application types with default values for nullable fields

import { Tables } from '../integrations/supabase/types';
import { Patient, Appointment, MedicalRecord } from '../types';

// Convert database Patient type to application Patient type
export function toPatient(dbPatient: Tables<'patients'>): Patient {
  return {
    id: dbPatient.id,
    firstName: dbPatient.first_name,
    lastName: dbPatient.last_name,
    dateOfBirth: dbPatient.date_of_birth,
    gender: dbPatient.gender,
    phone: dbPatient.phone,
    email: dbPatient.email || undefined,
    address: dbPatient.address,
    emergencyContact: dbPatient.emergency_contact,
    bloodType: dbPatient.blood_type || undefined,
    allergies: dbPatient.allergies || [],
    medicalHistory: dbPatient.medical_history || [],
    createdAt: dbPatient.created_at || new Date().toISOString(),
    updatedAt: dbPatient.updated_at || new Date().toISOString(),
    createdBy: dbPatient.created_by || undefined,
  };
}

// Convert database Appointment type to application Appointment type
export function toAppointment(dbAppointment: Tables<'appointments'>): Appointment {
  return {
    id: dbAppointment.id,
    patientId: dbAppointment.patient_id,
    doctorId: dbAppointment.doctor_id,
    date: dbAppointment.date,
    time: dbAppointment.time,
    duration: dbAppointment.duration,
    reason: dbAppointment.reason,
    status: dbAppointment.status || 'scheduled',
    notes: dbAppointment.notes || undefined,
    createdAt: dbAppointment.created_at || new Date().toISOString(),
    updatedAt: dbAppointment.updated_at || new Date().toISOString(),
    createdBy: dbAppointment.created_by || undefined,
  };
}

// Convert database MedicalRecord type to application MedicalRecord type  
export function toMedicalRecord(dbRecord: Tables<'medical_records'>): Omit<MedicalRecord, 'prescriptions'> {
  return {
    id: dbRecord.id,
    patientId: dbRecord.patient_id,
    doctorId: dbRecord.doctor_id,
    appointmentId: dbRecord.appointment_id || undefined,
    date: dbRecord.date,
    type: dbRecord.type,
    reason: dbRecord.reason,
    symptoms: dbRecord.symptoms || undefined,
    diagnosis: dbRecord.diagnosis,
    treatment: dbRecord.treatment || undefined,
    notes: dbRecord.notes || undefined,
    attachments: dbRecord.attachments || [],
    createdAt: dbRecord.created_at || new Date().toISOString(),
    updatedAt: dbRecord.updated_at || new Date().toISOString(),
  };
}

// Get status color based on appointment status
export function getStatusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    'no-show': 'bg-orange-100 text-orange-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Get status label based on appointment status
export function getStatusLabel(status: string | null): string {
  if (!status) return 'Non défini';
  const labels: Record<string, string> = {
    scheduled: 'Planifié',
    confirmed: 'Confirmé',
    completed: 'Terminé',
    cancelled: 'Annulé',
    'no-show': 'Absent'
  };
  return labels[status] || 'Non défini';
}
