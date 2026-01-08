import React, { useState } from 'react';
import { Users, Clock, DollarSign, Award, BarChart3, PieChart, AlertTriangle, TrendingDown, Heart } from 'lucide-react';
import { StaffStatsService } from '../../services/staff-stats';

export function StaffStats() {
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [metrics, setMetrics] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadStaffStats();
  }, []);

  const loadStaffStats = async () => {
    try {
      console.log('🔍 StaffStats.loadStaffStats() - Chargement des statistiques du personnel');
      setLoading(true);
      
      const [
        staffMetrics,
        monthlyStatsData,
        departmentStatsData,
        alertsData
      ] = await Promise.all([
        StaffStatsService.getStaffMetrics(),
        StaffStatsService.getMonthlyData(),
        StaffStatsService.getDepartmentStats(),
        StaffStatsService.getAlertsAndRecommendations()
      ]);

      console.log('✅ StaffStats.loadStaffStats() - Statistiques du personnel chargées avec succès');
      setMetrics(staffMetrics);
      setMonthlyData(monthlyStatsData);
      setDepartmentStats(departmentStatsData);
      setAlerts([...alertsData.alerts, ...alertsData.recommendations]);
    } catch (error) {
      console.error('❌ StaffStats.loadStaffStats() - Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getMetricColor = (value: number, type: 'performance' | 'attendance' | 'turnover') => {
    switch (type) {
      case 'performance':
      case 'attendance':
        if (value >= 90) return 'text-green-600';
        if (value >= 75) return 'text-yellow-600';
        return 'text-red-600';
      case 'turnover':
        if (value <= 5) return 'text-green-600';
        if (value <= 15) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAlertIcon = (iconName: string) => {
    const icons = {
      TrendingDown: TrendingDown,
      AlertTriangle: AlertTriangle,
      Award: Award,
      Users: Users,
      Heart: Heart
    };
    return icons[iconName as keyof typeof icons] || AlertTriangle;
  };

  const getAlertColor = (type: string) => {
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-700',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      error: 'bg-red-50 border-red-200 text-red-700',
      info: 'bg-blue-50 border-blue-200 text-blue-700'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des statistiques du personnel...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Erreur lors du chargement des statistiques</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Personnel Total</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{metrics.totalStaff}</p>
              <p className="text-sm text-green-600 mt-1">
                +{metrics.newHires} ce mois
              </p>
            </div>
            <div className="bg-blue-100 p-2 lg:p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de Performance</p>
              <p className={`text-xl lg:text-2xl font-bold ${getMetricColor(metrics.performanceScore, 'performance')}`}>
                {metrics.performanceScore.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">Basé sur les plannings</p>
            </div>
            <div className="bg-green-100 p-2 lg:p-3 rounded-full">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de Présence</p>
              <p className={`text-xl lg:text-2xl font-bold ${getMetricColor(metrics.attendanceRate, 'attendance')}`}>
                {metrics.attendanceRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">30 derniers jours</p>
            </div>
            <div className="bg-yellow-100 p-2 lg:p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Masse Salariale</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {Math.round(metrics.totalPayroll / 1000000)}M
              </p>
              <p className="text-sm text-gray-600 mt-1">FCFA/mois</p>
            </div>
            <div className="bg-purple-100 p-2 lg:p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Évolution Mensuelle</h3>
              <div className="flex items-center space-x-2 hidden sm:flex">
                <BarChart3 className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="performance">Performance</option>
                  <option value="hires">Embauches</option>
                  <option value="departures">Départs</option>
                </select>
              </div>
            </div>
            {/* Sélecteur mobile */}
            <div className="mt-4 sm:hidden">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="performance">Performance</option>
                <option value="hires">Embauches</option>
                <option value="departures">Départs</option>
              </select>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {monthlyData.map((data) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-sm font-medium text-gray-600">{data.month}</div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: selectedMetric === 'performance' ? `${data.performance}%` :
                                   selectedMetric === 'hires' ? `${Math.min((data.hires / Math.max(...monthlyData.map(d => d.hires), 1)) * 100, 100)}%` :
                                   `${Math.min((data.departures / Math.max(...monthlyData.map(d => d.departures), 1)) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {selectedMetric === 'performance' ? `${data.performance}%` :
                     selectedMetric === 'hires' ? data.hires :
                     data.departures}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Répartition par département */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800">Répartition par Département</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {departmentStats.map((dept, index) => {
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                const percentage = Math.round((dept.staff / metrics.totalStaff) * 100);
                
                return (
                  <div key={dept.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                        <span className="font-medium text-gray-900">{dept.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {dept.staff} personnes ({percentage}%)
                      </div>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[index]} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Budget: {formatCurrency(dept.budget)}</span>
                      <span>Performance: {dept.performance}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Métriques Détaillées</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(metrics.averageTenure)}</div>
              <div className="text-sm text-gray-600">Ancienneté moyenne (mois)</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.turnoverRate, 'turnover')}`}>
                {metrics.turnoverRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taux de rotation</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(metrics.averageSalary / 1000)}K
              </div>
              <div className="text-sm text-gray-600">Salaire moyen (FCFA)</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.activeStaff}</div>
              <div className="text-sm text-gray-600">Personnel actif</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes et recommandations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Alertes et Recommandations</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => {
              const IconComponent = getAlertIcon(alert.icon);
              return (
                <div key={index} className={`border rounded-lg p-4 ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              );
            })
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Tout va bien</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Aucune alerte particulière. L'équipe fonctionne bien.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}