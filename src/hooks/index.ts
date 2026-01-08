export { useRouter } from './useRouter';
export { useConfirm } from './useConfirm';

// Dashboard hooks centralisés pour éviter les requêtes redondantes
export { 
  useDashboardData, 
  useDashboardStats,
  useDashboardAppointments,
  useDashboardPatients,
  useDashboardInvoices,
  useDashboardMedicines,
  useDashboardMedicalRecords,
  useDashboardProfiles
} from './queries/useDashboardData';