import React, { useMemo } from 'react';
import { Users, Calendar, DollarSign, AlertTriangle } from 'lucide-react';
import { useDashboardStats } from '../../hooks/queries/useDashboardData';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
}

const StatCard = React.memo(function StatCard({ title, value, change, changeType, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card-elevated rounded-2xl p-6 hover-lift animate-scale-in border border-border/50 group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-3 mb-2">{value}</p>
          <p className={`text-sm font-medium flex items-center space-x-1 ${
            changeType === 'increase' ? 'text-success' : 'text-error'
          }`}>
            <span>{change}</span>
          </p>
        </div>
        <div className={`p-4 rounded-2xl shadow-md group-hover:scale-110 transition-transform duration-300 ${color}`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
    </div>
  );
});

export function DashboardStats() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  // Mémoriser les cartes de statistiques pour éviter les recalculs inutiles
  const statCards = useMemo(() => {
    if (!stats) return [];

    return [
      {
        title: 'Patients Total',
        value: stats.totalPatients.toString(), 
        change: stats.patientGrowth > 0 ? `+${stats.patientGrowth.toFixed(1)}% ce mois` : 
                stats.patientGrowth < 0 ? `${stats.patientGrowth.toFixed(1)}% ce mois` : 'Stable ce mois',
        changeType: 'increase' as const,
        icon: Users,
        color: 'bg-gradient-primary'
      },
      {
        title: 'RDV Aujourd\'hui',
        value: stats.todayAppointments.toString(),
        change: stats.pendingAppointments > 0 ? 
                `${stats.pendingAppointments} en attente` : 
                'Tous confirmés',
        changeType: 'increase' as const,
        icon: Calendar,
        color: 'bg-gradient-secondary'
      },
      {
        title: 'Revenus Mensuel',
        value: `${Math.round(stats.monthlyRevenue / 1000).toLocaleString()}K FCFA`,
        change: `+8% vs mois dernier`,
        changeType: 'increase' as const,
        icon: DollarSign,
        color: 'bg-gradient-accent'
      },
      {
        title: 'Stock Critique',
        value: stats.lowStockItems.toString(),
        change: stats.lowStockItems > 0 ? 'Réappro. urgente' : 'Stock OK',
        changeType: 'decrease' as const,
        icon: AlertTriangle,
        color: stats.lowStockItems > 0 ? 'bg-gradient-to-br from-error to-warning' : 'bg-gradient-secondary'
      }
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-elevated rounded-2xl p-6 border border-border/50">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded-lg w-3/4"></div>
              <div className="h-9 bg-muted rounded-lg w-1/2"></div>
              <div className="h-3 bg-muted rounded-lg w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {[
          { title: 'Patients Total', icon: Users, color: 'bg-gradient-primary' },
          { title: 'RDV Aujourd\'hui', icon: Calendar, color: 'bg-gradient-secondary' },
          { title: 'Revenus Mensuel', icon: DollarSign, color: 'bg-gradient-accent' },
          { title: 'Stock Critique', icon: AlertTriangle, color: 'bg-gradient-to-br from-error to-warning' }
        ].map((stat, i) => (
          <StatCard 
            key={i}
            title={stat.title}
            value="0"
            change="Erreur de chargement"
            changeType="increase"
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
