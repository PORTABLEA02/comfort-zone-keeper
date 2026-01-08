import { useMemo, useState, useCallback } from 'react';
import { Activity, User, Calendar, DollarSign, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useDashboardData } from '../../hooks/queries/useDashboardData';

interface ActivityItem {
  id: string;
  type: 'appointment' | 'payment' | 'consultation' | 'inventory' | 'user';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  status?: 'success' | 'warning' | 'info' | 'error';
  amount?: number;
}

// Fonctions utilitaires définies en dehors du composant pour éviter les recréations
const getActivityIcon = (type: string) => {
  const icons = {
    appointment: Calendar,
    payment: DollarSign,
    consultation: User,
    inventory: Package,
    user: User
  };
  return icons[type as keyof typeof icons] || Activity;
};

const getStatusColor = (status?: string) => {
  const colors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    error: 'bg-red-100 text-red-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'warning':
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
  return `Il y a ${Math.floor(diffInMinutes / 1440)} jour(s)`;
};

const getTypeLabel = (type: string) => {
  const labels = {
    appointment: 'Rendez-vous',
    payment: 'Paiements',
    consultation: 'Consultations',
    inventory: 'Inventaire',
    user: 'Utilisateurs'
  };
  return labels[type as keyof typeof labels] || type;
};

export function ActivityFeed() {
  const [filter, setFilter] = useState<string>('all');
  const { appointments, invoices, medicalRecords, patients, medicines, isLoading } = useDashboardData();

  // Mémoriser le calcul des activités
  const activities = useMemo<ActivityItem[]>(() => {
    const activityData: ActivityItem[] = [];

    // Paiements récents
    const recentPaidInvoices = invoices
      .filter(inv => inv.status === 'paid' && inv.paid_at)
      .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())
      .slice(0, 3);

    recentPaidInvoices.forEach(invoice => {
      const patient = patients.find(p => p.id === invoice.patient_id);
      activityData.push({
        id: `payment-${invoice.id}`,
        type: 'payment',
        title: 'Paiement reçu',
        description: `Facture ${invoice.id} - ${patient?.first_name} ${patient?.last_name}`,
        timestamp: invoice.paid_at!,
        user: 'Caissier',
        status: 'success',
        amount: invoice.total
      });
    });

    // Rendez-vous récents
    const recentAppointments = appointments
      .filter(a => a.created_at !== null)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
      .slice(0, 5);

    recentAppointments.forEach(appointment => {
      const patient = patients.find(p => p.id === appointment.patient_id);
      activityData.push({
        id: `appointment-${appointment.id}`,
        type: 'appointment',
        title: appointment.status === 'cancelled' ? 'Rendez-vous annulé' : 'Nouveau rendez-vous',
        description: `${appointment.reason} - ${patient?.first_name} ${patient?.last_name}`,
        timestamp: appointment.created_at || new Date().toISOString(),
        user: 'Secrétaire',
        status: appointment.status === 'cancelled' ? 'warning' : 'info'
      });
    });

    // Consultations récentes
    const recentConsultations = medicalRecords
      .sort((a, b) => new Date(b.created_at || new Date().toISOString()).getTime() - new Date(a.created_at || new Date().toISOString()).getTime())
      .slice(0, 3);

    recentConsultations.forEach(consultation => {
      const patient = patients.find(p => p.id === consultation.patient_id);
      activityData.push({
        id: `consultation-${consultation.id}`,
        type: 'consultation',
        title: 'Consultation terminée',
        description: `${consultation.diagnosis} - ${patient?.first_name} ${patient?.last_name}`,
        timestamp: consultation.created_at || new Date().toISOString(),
        user: 'Dr. Médecin',
        status: 'success'
      });
    });

    // Alertes de stock faible
    const lowStockMedicines = medicines.filter(med => med.current_stock <= med.min_stock);
    lowStockMedicines.slice(0, 3).forEach(medicine => {
      activityData.push({
        id: `inventory-${medicine.id}`,
        type: 'inventory',
        title: 'Stock faible',
        description: `${medicine.name} - ${medicine.current_stock} ${medicine.unit} restant(s)`,
        timestamp: medicine.updated_at || medicine.created_at || new Date().toISOString(),
        status: 'warning'
      });
    });

    // Trier par timestamp décroissant
    return activityData
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [appointments, invoices, medicalRecords, patients, medicines]);

  // Mémoriser les activités filtrées
  const filteredActivities = useMemo(() => 
    activities.filter(activity => filter === 'all' || activity.type === filter),
    [activities, filter]
  );

  // Mémoriser le handler de filtre
  const handleFilterChange = useCallback((filterType: string) => {
    setFilter(filterType);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement du flux d'activité...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-600" />
          Activité Récente
        </h3>
        <div className="text-sm text-gray-600">
          {activities.length} événements
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'appointment', 'payment', 'consultation', 'inventory', 'user'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => handleFilterChange(filterType)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === filterType
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filterType === 'all' ? 'Tout' : getTypeLabel(filterType)}
          </button>
        ))}
      </div>

      {/* Liste des activités */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredActivities.map((activity) => {
          const IconComponent = getActivityIcon(activity.type);
          
          return (
            <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                <IconComponent className="h-4 w-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                  <div className="flex items-center space-x-2">
                    {activity.amount && (
                      <span className="text-sm font-medium text-green-600">
                        {activity.amount.toLocaleString()} FCFA
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {getStatusIcon(activity.status)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  {activity.user && (
                    <span className="text-xs text-gray-500">par {activity.user}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'all' ? 'Aucune activité récente' : `Aucune activité de type "${getTypeLabel(filter)}"`}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Les activités apparaîtront ici au fur et à mesure de l'utilisation du système
          </p>
        </div>
      )}

      {/* Résumé de l'activité */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {activities.filter(a => a.type === 'appointment').length}
            </div>
            <div className="text-xs text-gray-600">RDV</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {activities.filter(a => a.type === 'payment').length}
            </div>
            <div className="text-xs text-gray-600">Paiements</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {activities.filter(a => a.type === 'consultation').length}
            </div>
            <div className="text-xs text-gray-600">Consultations</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {activities.filter(a => a.status === 'warning').length}
            </div>
            <div className="text-xs text-gray-600">Alertes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
