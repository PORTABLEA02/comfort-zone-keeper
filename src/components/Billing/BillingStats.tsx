import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, FileText, AlertCircle } from 'lucide-react';
import { InvoiceService } from '../../services/invoices';

interface BillingMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalInvoices: number;
  paidInvoices: number;
  averageInvoiceAmount: number;
  collectionRate: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  invoices: number;
  paid: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  percentage: number;
  color: string;
}

interface ServiceRevenueData {
  service: string;
  revenue: number;
  count: number;
}

export function BillingStats() {
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BillingMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    averageInvoiceAmount: 0,
    collectionRate: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<PaymentMethodData[]>([]);
  const [serviceRevenueData, setServiceRevenueData] = useState<ServiceRevenueData[]>([]);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      console.log('🔍 BillingStats.loadBillingData() - Chargement des données de facturation');
      setLoading(true);
      
      const [billingStats, invoices] = await Promise.all([
        InvoiceService.getBillingStats(),
        InvoiceService.getAll()
      ]);

      const averageAmount = billingStats.totalInvoices > 0 ? billingStats.totalRevenue / billingStats.totalInvoices : 0;
      const collectionRate = billingStats.totalRevenue > 0 ? (billingStats.paidAmount / billingStats.totalRevenue) * 100 : 0;

      setMetrics({
        totalRevenue: billingStats.totalRevenue,
        monthlyRevenue: billingStats.monthlyRevenue,
        pendingAmount: billingStats.pendingAmount,
        overdueAmount: billingStats.overdueAmount,
        totalInvoices: billingStats.totalInvoices,
        paidInvoices: billingStats.paidInvoices,
        averageInvoiceAmount: averageAmount,
        collectionRate: collectionRate
      });

      const monthlyStats = calculateMonthlyData(invoices);
      setMonthlyData(monthlyStats);

      const paymentStats = calculatePaymentMethodData(invoices);
      setPaymentMethodsData(paymentStats);

      const serviceStats = calculateServiceRevenueData(invoices);
      setServiceRevenueData(serviceStats);

      console.log('✅ BillingStats.loadBillingData() - Données de facturation chargées avec succès');
    } catch (error) {
      console.error('❌ BillingStats.loadBillingData() - Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyData = (invoices: any[]): MonthlyData[] => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentDate = new Date();
    const monthlyStats: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate.getMonth() === date.getMonth() && 
               invoiceDate.getFullYear() === date.getFullYear();
      });

      const revenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const paid = monthInvoices.filter(inv => inv.status === 'paid').length;

      monthlyStats.push({
        month: monthNames[date.getMonth()],
        revenue: revenue,
        invoices: monthInvoices.length,
        paid: paid
      });
    }

    return monthlyStats;
  };

  const calculatePaymentMethodData = (invoices: any[]): PaymentMethodData[] => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalPaidAmount = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const methodCounts = paidInvoices.reduce((acc, invoice) => {
      const method = invoice.payment_method || 'cash';
      acc[method] = (acc[method] || 0) + invoice.total;
      return acc;
    }, {} as Record<string, number>);

    const methodLabels: Record<string, string> = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      'mobile-money': 'Mobile Money',
      'bank-transfer': 'Virement',
      check: 'Chèque'
    };

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];

    return Object.entries(methodCounts).map(([method, amount], index) => ({
      method: methodLabels[method] || method,
      amount: amount as number,
      percentage: totalPaidAmount > 0 ? Math.round(((amount as number) / totalPaidAmount) * 100) : 0,
      color: colors[index % colors.length]
    }));
  };

  const calculateServiceRevenueData = (invoices: any[]): ServiceRevenueData[] => {
    const serviceStats: Record<string, { revenue: number; count: number }> = {};

    invoices.forEach(invoice => {
      const serviceType = getServiceTypeFromInvoice(invoice);
      if (!serviceStats[serviceType]) {
        serviceStats[serviceType] = { revenue: 0, count: 0 };
      }
      serviceStats[serviceType].revenue += invoice.total;
      serviceStats[serviceType].count += 1;
    });

    return Object.entries(serviceStats).map(([service, data]) => ({
      service,
      revenue: data.revenue,
      count: data.count
    })).sort((a, b) => b.revenue - a.revenue);
  };

  const getServiceTypeFromInvoice = (invoice: any): string => {
    switch (invoice.invoice_type) {
      case 'general-consultation':
        return 'Consultations générales';
      case 'gynecological-consultation':
        return 'Consultations gynécologiques';
      case 'ordinary':
        if (invoice.invoice_items?.some((item: any) => 
          item.description.toLowerCase().includes('consultation'))) {
          return 'Consultations spécialisées';
        } else if (invoice.invoice_items?.some((item: any) => 
          item.description.toLowerCase().includes('examen') || 
          item.description.toLowerCase().includes('ecg') ||
          item.description.toLowerCase().includes('échographie'))) {
          return 'Examens médicaux';
        } else if (invoice.invoice_items?.some((item: any) => 
          item.description.toLowerCase().includes('analyse') ||
          item.description.toLowerCase().includes('test'))) {
          return 'Analyses';
        }
        return 'Autres services';
      default:
        return 'Autres services';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentMonthRevenue = monthlyData[monthlyData.length - 1]?.revenue || 0;
  const previousMonthRevenue = monthlyData[monthlyData.length - 2]?.revenue || 0;
  const monthlyGrowth = calculateGrowth(currentMonthRevenue, previousMonthRevenue);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des statistiques de facturation...</p>
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
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires total</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getGrowthIcon(monthlyGrowth)}
                <span className={`text-xs lg:text-sm ${getGrowthColor(monthlyGrowth)}`}>
                  {monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% vs mois dernier
                </span>
              </div>
            </div>
            <div className="bg-blue-100 p-2 lg:p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenus ce mois</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatCurrency(metrics.monthlyRevenue)}</p>
              <div className="flex items-center space-x-1 mt-1">
                {getGrowthIcon(monthlyGrowth)}
                <span className={`text-xs lg:text-sm ${getGrowthColor(monthlyGrowth)}`}>
                  {monthlyGrowth > 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}% vs mois dernier
                </span>
              </div>
            </div>
            <div className="bg-green-100 p-2 lg:p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Montant en attente</p>
              <p className="text-xl lg:text-2xl font-bold text-yellow-600">{formatCurrency(metrics.pendingAmount)}</p>
              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                {metrics.totalRevenue > 0 ? Math.round((metrics.pendingAmount / metrics.totalRevenue) * 100) : 0}% du total
              </p>
            </div>
            <div className="bg-yellow-100 p-2 lg:p-3 rounded-full">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de recouvrement</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600">{metrics.collectionRate.toFixed(1)}%</p>
              <p className="text-xs lg:text-sm text-gray-500 mt-1">
                {metrics.paidInvoices}/{metrics.totalInvoices} factures payées
              </p>
            </div>
            <div className="bg-green-100 p-2 lg:p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
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
                  <option value="revenue">Revenus</option>
                  <option value="invoices">Factures</option>
                  <option value="collection">Taux de recouvrement</option>
                </select>
              </div>
            </div>
            <div className="mt-4 sm:hidden">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2"
              >
                <option value="revenue">Revenus</option>
                <option value="invoices">Factures</option>
                <option value="collection">Taux de recouvrement</option>
              </select>
            </div>
          </div>
          
          <div className="p-6">
            {monthlyData.length > 0 ? (
              <div className="space-y-4">
                {monthlyData.map((data) => {
                  const maxValue = Math.max(...monthlyData.map(d => 
                    selectedMetric === 'revenue' ? d.revenue :
                    selectedMetric === 'invoices' ? d.invoices :
                    d.invoices > 0 ? (d.paid / d.invoices) * 100 : 0
                  ));
                  
                  const currentValue = selectedMetric === 'revenue' ? data.revenue :
                                    selectedMetric === 'invoices' ? data.invoices :
                                    data.invoices > 0 ? (data.paid / data.invoices) * 100 : 0;
                  
                  const percentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;
                  
                  return (
                    <div key={data.month} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 text-sm font-medium text-gray-600">{data.month}</div>
                        <div className="flex-1 w-48">
                          <div className="bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900 min-w-[100px] text-right">
                        {selectedMetric === 'revenue' ? formatCurrency(currentValue) :
                         selectedMetric === 'invoices' ? `${currentValue} factures` :
                         `${currentValue.toFixed(1)}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune donnée mensuelle disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Répartition par mode de paiement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800">Modes de Paiement</h3>
            </div>
          </div>
          
          <div className="p-6">
            {paymentMethodsData.length > 0 ? (
              <div className="space-y-4">
                {paymentMethodsData.map((method) => (
                  <div key={method.method} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${method.color}`}></div>
                        <span className="font-medium text-gray-900">{method.method}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {method.percentage}%
                      </div>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${method.color} transition-all duration-300`}
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatCurrency(method.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune donnée de paiement disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenus par service */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800">Revenus par Type de Service</h3>
          </div>
        </div>
        
        <div className="p-6">
          {serviceRevenueData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceRevenueData.map((service) => (
                <div key={service.service} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{service.service}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{service.count} factures</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(service.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune donnée de service disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
