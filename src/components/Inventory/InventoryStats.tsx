import React, { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { MedicineService } from '../../services/medicines';

export function InventoryStats() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadInventoryStats();
  }, []);

  const loadInventoryStats = async () => {
    try {
      setLoading(true);
      const stats = await MedicineService.getInventoryStats();
      setMetrics(stats);
    } catch (error) {
      console.error('Error loading inventory stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Chargement des statistiques d'inventaire...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
              <p className="text-sm font-medium text-gray-600">Total Produits</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{metrics.totalItems}</p>
              <p className="text-sm text-gray-600 mt-1">Produits en stock</p>
            </div>
            <div className="bg-blue-100 p-2 lg:p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Totale</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">
                {Math.round(metrics.totalValue / 1000000)}M FCFA
              </p>
              <p className="text-sm text-gray-600 mt-1">Valeur totale</p>
            </div>
            <div className="bg-green-100 p-2 lg:p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Faible</p>
              <p className="text-xl lg:text-2xl font-bold text-orange-600">{metrics.lowStockItems}</p>
              <p className="text-sm text-orange-600 mt-1">Réappro. urgente</p>
            </div>
            <div className="bg-orange-100 p-2 lg:p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expire Bientôt</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600">{metrics.expiringSoon}</p>
              <p className="text-sm text-red-600 mt-1">À surveiller</p>
            </div>
            <div className="bg-red-100 p-2 lg:p-3 rounded-full">
              <Calendar className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recommandations</h3>
        </div>
        
        <div className="p-6 space-y-4">
          {metrics.lowStockItems > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800">Urgent</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {metrics.lowStockItems} produits ont un stock critique. 
                Commandez immédiatement pour éviter les ruptures.
              </p>
            </div>
          )}
          
          {metrics.expiringSoon > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Attention</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                {metrics.expiringSoon} produits expirent dans les 90 prochains jours. 
                Planifiez leur utilisation prioritaire.
              </p>
            </div>
          )}
          
          {metrics.lowStockItems === 0 && metrics.expiringSoon === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Excellent</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Votre inventaire est bien géré. Aucune alerte critique.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}