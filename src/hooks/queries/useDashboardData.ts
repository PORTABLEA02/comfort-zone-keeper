import { useQuery } from '@tanstack/react-query';
import { AppointmentService } from '../../services/appointments';
import { PatientService } from '../../services/patients';
import { InvoiceService } from '../../services/invoices';
import { MedicineService } from '../../services/medicines';
import { MedicalRecordService } from '../../services/medical-records';
import { ProfileService } from '../../services/profiles';

// Clés de cache unifiées pour éviter les requêtes redondantes
export const DASHBOARD_KEYS = {
  appointments: ['dashboard', 'appointments'] as const,
  patients: ['dashboard', 'patients'] as const,
  invoices: ['dashboard', 'invoices'] as const,
  medicines: ['dashboard', 'medicines'] as const,
  medicalRecords: ['dashboard', 'medicalRecords'] as const,
  profiles: ['dashboard', 'profiles'] as const,
  stats: ['dashboard', 'stats'] as const,
};

// Hook pour les rendez-vous (cache 5 minutes)
export function useDashboardAppointments() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.appointments,
    queryFn: () => AppointmentService.getAll(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// Hook pour les patients (cache 5 minutes)
export function useDashboardPatients() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.patients,
    queryFn: () => PatientService.getAll(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// Hook pour les factures (cache 2 minutes)
export function useDashboardInvoices() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.invoices,
    queryFn: () => InvoiceService.getAll(),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
}

// Hook pour les médicaments (cache 5 minutes)
export function useDashboardMedicines() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.medicines,
    queryFn: () => MedicineService.getAll(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// Hook pour les dossiers médicaux (cache 5 minutes)
export function useDashboardMedicalRecords() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.medicalRecords,
    queryFn: () => MedicalRecordService.getAll(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// Hook pour les profils (cache 5 minutes)
export function useDashboardProfiles() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.profiles,
    queryFn: () => ProfileService.getAll(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// Hook combiné pour toutes les données du dashboard (évite les requêtes multiples)
export function useDashboardData() {
  const appointments = useDashboardAppointments();
  const patients = useDashboardPatients();
  const invoices = useDashboardInvoices();
  const medicines = useDashboardMedicines();
  const medicalRecords = useDashboardMedicalRecords();

  const isLoading = 
    appointments.isLoading || 
    patients.isLoading || 
    invoices.isLoading || 
    medicines.isLoading ||
    medicalRecords.isLoading;

  const isError = 
    appointments.isError || 
    patients.isError || 
    invoices.isError || 
    medicines.isError ||
    medicalRecords.isError;

  return {
    appointments: appointments.data ?? [],
    patients: patients.data ?? [],
    invoices: invoices.data ?? [],
    medicines: medicines.data ?? [],
    medicalRecords: medicalRecords.data ?? [],
    isLoading,
    isError,
    refetch: () => {
      appointments.refetch();
      patients.refetch();
      invoices.refetch();
      medicines.refetch();
      medicalRecords.refetch();
    }
  };
}

// Hook pour les statistiques du dashboard (calculées à partir des données)
export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats,
    queryFn: async () => {
      const [appointmentStats, billingStats, inventoryStats, patientsData] = await Promise.all([
        AppointmentService.getStats(),
        InvoiceService.getBillingStats(),
        MedicineService.getInventoryStats(),
        PatientService.getAll()
      ]);

      // Calculer la croissance mensuelle des patients
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonthPatients = patientsData.filter(p => {
        if (!p.created_at) return false;
        const createdDate = new Date(p.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length;
      
      const lastMonthPatients = patientsData.filter(p => {
        if (!p.created_at) return false;
        const createdDate = new Date(p.created_at);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear;
      }).length;
      
      const patientGrowth = lastMonthPatients > 0 
        ? ((thisMonthPatients - lastMonthPatients) / lastMonthPatients) * 100 
        : 0;

      return {
        totalPatients: patientsData.length,
        patientGrowth,
        todayAppointments: appointmentStats.today.total,
        pendingAppointments: appointmentStats.today.pending,
        monthlyRevenue: billingStats.monthlyRevenue,
        lowStockItems: inventoryStats.lowStockItems,
        appointmentStats,
        billingStats,
        inventoryStats
      };
    },
    staleTime: 1000 * 60 * 2, // Cache 2 minutes
    gcTime: 1000 * 60 * 5,
  });
}
