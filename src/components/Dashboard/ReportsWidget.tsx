import { useState, useMemo, useCallback, memo } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Users, DollarSign, Activity, ChevronRight } from 'lucide-react';
import { useRouter } from '../../hooks/useRouter';
import { useDashboardData } from '../../hooks/queries/useDashboardData';

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage?: number;
}

interface MonthlyData {
  month: string;
  appointments: number;
  revenue: number;
  patients: number;
}

// Constantes définies en dehors du composant
const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3B82F6',
  confirmed: '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
  'no-show': '#F59E0B'
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Planifiés',
  confirmed: 'Confirmés',
  completed: 'Terminés',
  cancelled: 'Annulés',
  'no-show': 'Absents'
};

const CATEGORY_COLORS: Record<string, string> = {
  medication: '#3B82F6',
  'medical-supply': '#10B981',
  equipment: '#F59E0B',
  consumable: '#EF4444',
  diagnostic: '#8B5CF6'
};

const CATEGORY_LABELS: Record<string, string> = {
  medication: 'Médicaments',
  'medical-supply': 'Fournitures',
  equipment: 'Équipements',
  consumable: 'Consommables',
  diagnostic: 'Diagnostic'
};

const AGE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// Composant MetricsCards mémorisé
const MetricsCards = memo(function MetricsCards({
  revenueByMonth,
  appointmentsByStatus,
  patientsByAge,
  inventoryByCategory
}: {
  revenueByMonth: MonthlyData[];
  appointmentsByStatus: ChartData[];
  patientsByAge: ChartData[];
  inventoryByCategory: ChartData[];
}) {
  const totalRevenue = revenueByMonth.reduce((sum, d) => sum + d.revenue, 0);
  const totalAppointments = appointmentsByStatus.reduce((sum, d) => sum + d.value, 0);
  const totalPatients = patientsByAge.reduce((sum, d) => sum + d.value, 0);
  const totalInventory = inventoryByCategory.reduce((sum, d) => sum + d.value, 0);

  const currentMonth = revenueByMonth[revenueByMonth.length - 1];
  const previousMonth = revenueByMonth[revenueByMonth.length - 2];
  const growth = previousMonth && previousMonth.revenue > 0 
    ? ((currentMonth?.revenue - previousMonth.revenue) / previousMonth.revenue) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Revenus Total</p>
            <p className="text-2xl font-bold">{Math.round(totalRevenue / 1000000)}M FCFA</p>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">
                {growth > 0 ? '+' : ''}{growth.toFixed(1)}% vs mois dernier
              </span>
            </div>
          </div>
          <DollarSign className="h-8 w-8 text-blue-200" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm font-medium">Rendez-vous</p>
            <p className="text-2xl font-bold">{totalAppointments}</p>
            <p className="text-sm text-green-100">
              {appointmentsByStatus.find(a => a.label === 'Confirmés')?.value || 0} confirmés
            </p>
          </div>
          <Calendar className="h-8 w-8 text-green-200" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">Patients</p>
            <p className="text-2xl font-bold">{totalPatients}</p>
            <p className="text-sm text-purple-100">Base de données</p>
          </div>
          <Users className="h-8 w-8 text-purple-200" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm font-medium">Inventaire</p>
            <p className="text-2xl font-bold">{totalInventory}</p>
            <p className="text-sm text-orange-100">Produits en stock</p>
          </div>
          <Activity className="h-8 w-8 text-orange-200" />
        </div>
      </div>
    </div>
  );
});

// Composant PieChart mémorisé
const PieChartComponent = memo(function PieChartComponent({ data, title }: { data: ChartData[], title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <PieChart className="h-5 w-5 mr-2 text-blue-600" />
        {title}
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" strokeWidth="20" />
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const strokeDasharray = `${percentage * 5.03} 502`;
              const strokeDashoffset = -cumulativePercentage * 5.03;
              cumulativePercentage += percentage;

              return (
                <circle
                  key={index}
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">{item.value}</div>
                <div className="text-sm text-gray-600">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Composant BarChart mémorisé
const BarChartComponent = memo(function BarChartComponent({ data, title }: { data: MonthlyData[], title: string }) {
  const maxValue = Math.max(...data.map(d => d.revenue));
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalAppointments = data.reduce((sum, d) => sum + d.appointments, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
        {title}
      </h3>
      
      <div className="space-y-4">
        {data.map((item) => {
          const percentage = maxValue > 0 ? (item.revenue / maxValue) * 100 : 0;
          
          return (
            <div key={item.month} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 text-sm font-medium text-gray-600">{item.month}</div>
                  <div className="flex-1 w-48">
                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-right min-w-[120px]">
                  <div className="font-bold text-gray-900">
                    {Math.round(item.revenue / 1000).toLocaleString()}K FCFA
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.appointments} RDV • {item.patients} patients
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-green-600">{Math.round(totalRevenue / 1000000)}M</div>
            <div className="text-xs text-gray-600">Total revenus</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{totalAppointments}</div>
            <div className="text-xs text-gray-600">Total RDV</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {Math.round(totalRevenue / Math.max(1, totalAppointments) / 1000)}K
            </div>
            <div className="text-xs text-gray-600">Revenus/RDV</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export function ReportsWidget() {
  const { navigate } = useRouter();
  const { appointments, invoices, patients, medicines, isLoading } = useDashboardData();
  const [selectedChart, setSelectedChart] = useState<'appointments' | 'revenue' | 'patients' | 'inventory'>('appointments');

  // Mémoriser le calcul des données de rendez-vous par statut
  const appointmentsByStatus = useMemo<ChartData[]>(() => {
    const statusCounts: Record<string, number> = {};
    appointments.forEach((apt) => {
      const status = apt.status || 'scheduled';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const total = Object.values(statusCounts).reduce((sum, c) => sum + c, 0);

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#6B7280',
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [appointments]);

  // Mémoriser le calcul des revenus par mois
  const revenueByMonth = useMemo<MonthlyData[]>(() => {
    const currentDate = new Date();
    const monthlyData: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      
      const monthInvoices = invoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate.getMonth() === date.getMonth() && invoiceDate.getFullYear() === date.getFullYear();
      });

      const monthAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === date.getMonth() && aptDate.getFullYear() === date.getFullYear();
      });

      const monthPatients = new Set(monthInvoices.map((inv) => inv.patient_id)).size;

      monthlyData.push({
        month: MONTH_NAMES[date.getMonth()],
        appointments: monthAppointments.length,
        revenue: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
        patients: monthPatients
      });
    }

    return monthlyData;
  }, [appointments, invoices]);

  // Mémoriser le calcul des patients par âge
  const patientsByAge = useMemo<ChartData[]>(() => {
    const ageGroups: Record<string, number> = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };

    patients.forEach((patient) => {
      const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    });

    const total = Object.values(ageGroups).reduce((sum, c) => sum + c, 0);

    return Object.entries(ageGroups).map(([range, count], index) => ({
      label: `${range} ans`,
      value: count,
      color: AGE_COLORS[index],
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [patients]);

  // Mémoriser le calcul de l'inventaire par catégorie
  const inventoryByCategory = useMemo<ChartData[]>(() => {
    const categoryCounts: Record<string, number> = {};
    medicines.forEach((med) => {
      categoryCounts[med.category] = (categoryCounts[med.category] || 0) + 1;
    });

    const total = Object.values(categoryCounts).reduce((sum, c) => sum + c, 0);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      label: CATEGORY_LABELS[category] || category,
      value: count,
      color: CATEGORY_COLORS[category] || '#6B7280',
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }, [medicines]);

  // Mémoriser le handler de sélection de graphique
  const handleChartSelect = useCallback((chartType: 'appointments' | 'revenue' | 'patients' | 'inventory') => {
    setSelectedChart(chartType);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MetricsCards 
        revenueByMonth={revenueByMonth}
        appointmentsByStatus={appointmentsByStatus}
        patientsByAge={patientsByAge}
        inventoryByCategory={inventoryByCategory}
      />

      {/* Sélecteur de graphique */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'appointments' as const, label: 'Rendez-vous', icon: Calendar },
            { id: 'revenue' as const, label: 'Revenus', icon: DollarSign },
            { id: 'patients' as const, label: 'Patients', icon: Users },
            { id: 'inventory' as const, label: 'Inventaire', icon: Activity }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleChartSelect(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedChart === id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {selectedChart === 'appointments' && (
          <PieChartComponent data={appointmentsByStatus} title="Répartition des Rendez-vous par Statut" />
        )}
        {selectedChart === 'patients' && (
          <PieChartComponent data={patientsByAge} title="Répartition des Patients par Âge" />
        )}
        {selectedChart === 'inventory' && (
          <PieChartComponent data={inventoryByCategory} title="Répartition de l'Inventaire par Catégorie" />
        )}
        {selectedChart === 'revenue' && (
          <BarChartComponent data={revenueByMonth} title="Évolution des Revenus (6 derniers mois)" />
        )}
        {selectedChart !== 'revenue' && (
          <BarChartComponent data={revenueByMonth} title="Évolution des Revenus (6 derniers mois)" />
        )}
        {selectedChart === 'revenue' && appointmentsByStatus.length > 0 && (
          <PieChartComponent data={appointmentsByStatus} title="Répartition des Rendez-vous par Statut" />
        )}
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions Rapides</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('appointments')}
            className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Voir Planning</span>
            </div>
            <ChevronRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('billing')}
            className="flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Facturation</span>
            </div>
            <ChevronRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('patients')}
            className="flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800">Patients</span>
            </div>
            <ChevronRight className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </button>

          <button 
            onClick={() => navigate('inventory')}
            className="flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-orange-600" />
              <span className="font-medium text-orange-800">Inventaire</span>
            </div>
            <ChevronRight className="h-4 w-4 text-orange-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
