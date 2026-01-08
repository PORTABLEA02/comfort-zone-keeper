import { supabase } from '../lib/supabase';

interface StaffMetrics {
  totalStaff: number;
  activeStaff: number;
  onLeaveStaff: number;
  newHires: number;
  turnoverRate: number;
  averageTenure: number;
  totalPayroll: number;
  averageSalary: number;
  performanceScore: number;
  attendanceRate: number;
}

interface MonthlyData {
  month: string;
  hires: number;
  departures: number;
  performance: number;
}

interface DepartmentStats {
  name: string;
  staff: number;
  budget: number;
  performance: number;
}

export class StaffStatsService {
  // Récupérer les métriques principales du personnel
  static async getStaffMetrics(): Promise<StaffMetrics> {
    console.log('🔍 StaffStatsService.getStaffMetrics() - Récupération des métriques du personnel');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('❌ StaffStatsService.getStaffMetrics() - Erreur lors de la récupération des profils:', error);
      throw error;
    }

    const totalStaff = profiles?.length || 0;
    const activeStaff = profiles?.filter(p => p.is_active).length || 0;
    const onLeaveStaff = totalStaff - activeStaff;

    // Calculer les nouvelles embauches ce mois
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newHires = profiles?.filter(p => {
      if (!p.hire_date) return false;
      const hireDate = new Date(p.hire_date);
      return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
    }).length || 0;

    // Calculer l'ancienneté moyenne en mois
    const averageTenure = profiles?.reduce((total, profile) => {
      if (!profile.hire_date) return total;
      const hireDate = new Date(profile.hire_date);
      const now = new Date();
      const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth());
      return total + Math.max(0, months);
    }, 0) / Math.max(1, profiles?.filter(p => p.hire_date).length || 1) || 0;

    // Calculer la masse salariale totale
    const totalPayroll = profiles?.reduce((total, profile) => {
      return total + (profile.salary || 0);
    }, 0) || 0;

    const averageSalary = totalStaff > 0 ? totalPayroll / totalStaff : 0;

    // Taux de rotation (simplifié - basé sur les comptes inactifs)
    const turnoverRate = totalStaff > 0 ? (onLeaveStaff / totalStaff) * 100 : 0;

    // Score de performance et taux de présence (calculés à partir des plannings)
    const { data: schedules } = await supabase
      .from('staff_schedules')
      .select('*')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 derniers jours

    const totalSchedules = schedules?.length || 0;
    const completedSchedules = schedules?.filter(s => s.status === 'completed').length || 0;
    const absentSchedules = schedules?.filter(s => s.status === 'absent').length || 0;

    const attendanceRate = totalSchedules > 0 ? ((totalSchedules - absentSchedules) / totalSchedules) * 100 : 100;
    const performanceScore = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 85;

    const metrics: StaffMetrics = {
      totalStaff,
      activeStaff,
      onLeaveStaff,
      newHires,
      turnoverRate,
      averageTenure,
      totalPayroll,
      averageSalary,
      performanceScore,
      attendanceRate
    };

    console.log('✅ StaffStatsService.getStaffMetrics() - Métriques du personnel récupérées:', metrics);
    return metrics;
  }

  // Récupérer les données mensuelles
  static async getMonthlyData(): Promise<MonthlyData[]> {
    console.log('🔍 StaffStatsService.getMonthlyData() - Récupération des données mensuelles');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('hire_date, is_active, created_at');

    if (error) {
      console.error('❌ StaffStatsService.getMonthlyData() - Erreur lors de la récupération des données mensuelles:', error);
      throw error;
    }

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentDate = new Date();
    const monthlyData: MonthlyData[] = [];

    // Calculer pour les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthProfiles = profiles?.filter(profile => {
        if (!profile.hire_date) return false;
        const hireDate = new Date(profile.hire_date);
        return hireDate.getMonth() === date.getMonth() && 
               hireDate.getFullYear() === date.getFullYear();
      }) || [];

      // Calculer les départs (profils devenus inactifs ce mois)
      const departures = profiles?.filter(profile => {
        const updatedDate = profile.created_at ? new Date(profile.created_at) : new Date();
        return !profile.is_active &&
               updatedDate.getMonth() === date.getMonth() && 
               updatedDate.getFullYear() === date.getFullYear();
      }).length || 0;

      // Score de performance basé sur le ratio actifs/total
      const activeInMonth = monthProfiles.filter(p => p.is_active).length;
      const performance = monthProfiles.length > 0 ? (activeInMonth / monthProfiles.length) * 100 : 85;

      monthlyData.push({
        month: monthNames[date.getMonth()],
        hires: monthProfiles.length,
        departures: departures,
        performance: Math.round(performance)
      });
    }

    console.log('✅ StaffStatsService.getMonthlyData() - Données mensuelles récupérées:', monthlyData.length, 'mois');
    return monthlyData;
  }

  // Récupérer les statistiques par département
  static async getDepartmentStats(): Promise<DepartmentStats[]> {
    console.log('🔍 StaffStatsService.getDepartmentStats() - Récupération des statistiques par département');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('department, salary, is_active')
      .eq('is_active', true);

    if (error) {
      console.error('❌ StaffStatsService.getDepartmentStats() - Erreur lors de la récupération des statistiques par département:', error);
      throw error;
    }

    // Grouper par département
    const departmentGroups = profiles?.reduce((acc, profile) => {
      const dept = profile.department || 'Non défini';
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(profile);
      return acc;
    }, {} as Record<string, typeof profiles>) || {};

    const departmentStats: DepartmentStats[] = Object.entries(departmentGroups).map(([name, staff]) => {
      const budget = staff.reduce((total, member) => total + (member.salary || 0), 0);
      const performance = Math.round(85 + Math.random() * 15); // Score simulé entre 85-100%
      
      return {
        name,
        staff: staff.length,
        budget,
        performance
      };
    }).sort((a, b) => b.staff - a.staff);

    console.log('✅ StaffStatsService.getDepartmentStats() - Statistiques par département récupérées:', departmentStats.length, 'départements');
    return departmentStats;
  }

  // Récupérer les alertes et recommandations
  static async getAlertsAndRecommendations() {
    console.log('🔍 StaffStatsService.getAlertsAndRecommendations() - Récupération des alertes et recommandations');
    
    const metrics = await this.getStaffMetrics();

    const alerts = [];
    const recommendations = [];

    // Analyser les métriques pour générer des alertes
    if (metrics.attendanceRate < 90) {
      alerts.push({
        type: 'warning',
        title: 'Attention',
        message: `Le taux de présence a diminué à ${metrics.attendanceRate.toFixed(1)}%. Considérez une analyse des causes d'absence.`,
        icon: 'TrendingDown'
      });
    }

    if (metrics.turnoverRate > 15) {
      alerts.push({
        type: 'error',
        title: 'Alerte',
        message: `Le taux de rotation est élevé (${metrics.turnoverRate.toFixed(1)}%). Examinez les causes de départ du personnel.`,
        icon: 'AlertTriangle'
      });
    }

    if (metrics.performanceScore >= 90) {
      alerts.push({
        type: 'success',
        title: 'Excellent',
        message: `La performance globale de l'équipe s'améliore constamment (${metrics.performanceScore.toFixed(1)}%).`,
        icon: 'Award'
      });
    }

    // Recommandations basées sur les données
    if (metrics.totalStaff < 10) {
      recommendations.push({
        type: 'info',
        title: 'Recommandation',
        message: 'Envisagez de recruter du personnel supplémentaire pour améliorer la couverture des services.',
        icon: 'Users'
      });
    }

    if (metrics.averageTenure < 12) {
      recommendations.push({
        type: 'info',
        title: 'Fidélisation',
        message: 'L\'ancienneté moyenne est faible. Considérez des mesures de fidélisation du personnel.',
        icon: 'Heart'
      });
    }

    console.log('✅ StaffStatsService.getAlertsAndRecommendations() - Alertes et recommandations générées:', {
      alerts: alerts.length,
      recommendations: recommendations.length
    });

    return { alerts, recommendations };
  }
}