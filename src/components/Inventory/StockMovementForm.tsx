import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { FormField } from '../UI/FormField';
import { FormActions } from '../UI/FormActions';

type Medicine = Database['public']['Tables']['medicines']['Row'];
type StockMovement = Database['public']['Tables']['stock_movements']['Row'];

interface StockMovementFormProps {
  product: Medicine;
  onClose: () => void;
  onSave: (movement: Partial<StockMovement>) => void;
}

export function StockMovementForm({ product, onClose, onSave }: StockMovementFormProps) {
  const [formData, setFormData] = useState({
    type: 'in' as 'in' | 'out',
    quantity: 1,
    reason: '',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'La quantité doit être supérieure à 0';
    }
    
    if (formData.type === 'out' && formData.quantity > product.current_stock) {
      newErrors.quantity = 'Quantité insuffisante en stock';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Le motif est requis';
    }
    
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        onSave({
          medicine_id: product.id,
          type: formData.type,
          quantity: formData.quantity,
          reason: formData.reason,
          reference: formData.reference || undefined,
          date: formData.date
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const newStock = formData.type === 'in' 
    ? product.current_stock + formData.quantity 
    : product.current_stock - formData.quantity;

  const reasonSuggestions = {
    in: [
      'Réception commande',
      'Retour patient',
      'Transfert interne',
      'Correction inventaire',
      'Don/Échantillon'
    ],
    out: [
      'Dispensation patient',
      'Utilisation service',
      'Transfert externe',
      'Péremption',
      'Casse/Perte'
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="bg-success-light p-2 rounded-xl border border-success/30">
              <Package className="h-6 w-6 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">Mouvement de Stock</h2>
              <p className="text-sm text-muted-foreground">{product.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-info-light rounded-xl p-4 border border-info/20">
            <h3 className="font-medium text-info mb-3">Informations Produit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Produit:</span>
                <p className="text-gray-900">{product.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Stock actuel:</span>
                <p className="text-gray-900 font-bold">{product.current_stock} {product.unit}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Emplacement:</span>
                <p className="text-gray-900">{product.location}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Stock minimum:</span>
                <p className="text-gray-900">{product.min_stock} {product.unit}</p>
              </div>
            </div>
          </div>

          {/* Movement Details */}
          <div className="bg-muted rounded-xl p-4 border border-border/50">
            <h3 className="font-medium text-foreground mb-4">Détails du Mouvement</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de mouvement *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all hover-lift ${
                    formData.type === 'in' ? 'border-success bg-success-light shadow-sm' : 'border-border hover:border-success/50'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      value="in"
                      checked={formData.type === 'in'}
                      onChange={handleChange}
                      className="text-success focus:ring-success"
                    />
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="font-medium text-foreground">Entrée</span>
                  </label>
                  
                  <label className={`flex items-center space-x-3 p-3 border-2 rounded-xl cursor-pointer transition-all hover-lift ${
                    formData.type === 'out' ? 'border-error bg-error-light shadow-sm' : 'border-border hover:border-error/50'
                  }`}>
                    <input
                      type="radio"
                      name="type"
                      value="out"
                      checked={formData.type === 'out'}
                      onChange={handleChange}
                      className="text-error focus:ring-error"
                    />
                    <TrendingDown className="h-5 w-5 text-error" />
                    <span className="font-medium text-foreground">Sortie</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={`Quantité (${product.unit})`}
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  error={errors.quantity}
                  required
                />

                <FormField
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  error={errors.date}
                  required
                />
              </div>

              <FormField
                label="Motif"
                name="reason"
                type="select"
                value={formData.reason}
                onChange={handleChange}
                error={errors.reason}
                required
              >
                <option value="">Sélectionner un motif</option>
                {reasonSuggestions[formData.type].map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
                <option value="Autre">Autre (préciser en référence)</option>
              </FormField>

              <FormField
                label="Référence (optionnel)"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Numéro de bon, facture, etc."
              />
            </div>
          </div>

          {/* Stock Preview */}
          <div className={`rounded-xl p-4 border animate-slide-down ${
            formData.type === 'in' ? 'bg-success-light border-success/30' : 'bg-error-light border-error/30'
          }`}>
            <h3 className={`font-medium mb-3 ${
              formData.type === 'in' ? 'text-success' : 'text-error'
            }`}>
              Aperçu du Stock
            </h3>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-card rounded-xl p-3 shadow-sm border border-border">
                <div className="text-lg font-bold text-foreground">{product.current_stock}</div>
                <div className="text-sm text-muted-foreground">Stock actuel</div>
              </div>
              
              <div className="bg-card rounded-xl p-3 shadow-sm border border-border">
                <div className={`text-lg font-bold ${
                  formData.type === 'in' ? 'text-success' : 'text-error'
                }`}>
                  {formData.type === 'in' ? '+' : '-'}{formData.quantity}
                </div>
                <div className="text-sm text-muted-foreground">Mouvement</div>
              </div>
              
              <div className="bg-card rounded-xl p-3 shadow-sm border border-border">
                <div className={`text-lg font-bold ${
                  newStock <= product.min_stock ? 'text-error' : 'text-success'
                }`}>
                  {newStock}
                </div>
                <div className="text-sm text-muted-foreground">Nouveau stock</div>
              </div>
            </div>

            {newStock <= product.min_stock && (
              <div className="mt-3 p-3 bg-warning-light border border-warning rounded-xl animate-pulse">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <span className="text-sm font-medium text-warning">
                    Attention: Le stock sera en dessous du minimum après ce mouvement
                  </span>
                </div>
              </div>
            )}
          </div>

          <FormActions
            onCancel={onClose}
            isSubmitting={isSubmitting}
            submitLabel="Enregistrer le mouvement"
          />
        </form>
      </div>
    </div>
  );
}