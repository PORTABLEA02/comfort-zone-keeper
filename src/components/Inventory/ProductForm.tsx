import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { FormField } from '../UI/FormField';
import { FormActions } from '../UI/FormActions';

type Medicine = Database['public']['Tables']['medicines']['Row'];

interface ProductFormProps {
  product?: Medicine;
  onClose: () => void;
  onSave: (product: Partial<Medicine>) => void;
}

export function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'medication',
    manufacturer: product?.manufacturer || '',
    batch_number: product?.batch_number || '',
    expiry_date: product?.expiry_date || '',
    current_stock: product?.current_stock || 0,
    min_stock: product?.min_stock || 0,
    unit_price: product?.unit_price || 0,
    location: product?.location || '',
    unit: product?.unit || '',
    description: product?.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }
    
    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Le fabricant est requis';
    }
    
    if (!formData.batch_number.trim()) {
      newErrors.batch_number = 'Le numéro de lot est requis';
    }
    
    if (!formData.expiry_date) {
      newErrors.expiry_date = 'La date d\'expiration est requise';
    } else {
      const expiryDate = new Date(formData.expiry_date);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.expiry_date = 'La date d\'expiration doit être dans le futur';
      }
    }
    
    if (formData.current_stock < 0) {
      newErrors.current_stock = 'Le stock actuel ne peut pas être négatif';
    }
    
    if (formData.min_stock < 0) {
      newErrors.min_stock = 'Le stock minimum ne peut pas être négatif';
    }
    
    if (formData.unit_price <= 0) {
      newErrors.unit_price = 'Le prix unitaire doit être supérieur à 0';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'L\'emplacement est requis';
    }
    
    if (!formData.unit.trim()) {
      newErrors.unit = 'L\'unité de mesure est requise';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        onSave({
          ...formData,
          current_stock: Number(formData.current_stock),
          min_stock: Number(formData.min_stock),
          unit_price: Number(formData.unit_price)
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

  const generateBatchNumber = () => {
    const prefix = formData.manufacturer.substring(0, 2).toUpperCase() || 'XX';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const batch_number = `${prefix}${year}${random}`;
    setFormData({ ...formData, batch_number });
  };

  const categoryOptions = [
    { value: 'medication', label: 'Médicaments' },
    { value: 'medical-supply', label: 'Fournitures médicales' },
    { value: 'equipment', label: 'Équipements' },
    { value: 'consumable', label: 'Consommables' },
    { value: 'diagnostic', label: 'Matériel de diagnostic' }
  ];

  const unitOptions = {
    medication: ['comprimé', 'gélule', 'boîte', 'flacon', 'ampoule', 'tube', 'sachet'],
    'medical-supply': ['pièce', 'boîte', 'paquet', 'rouleau', 'set', 'kit'],
    equipment: ['pièce', 'unité', 'appareil'],
    consumable: ['litre', 'ml', 'kg', 'g', 'paquet', 'flacon', 'tube'],
    diagnostic: ['boîte', 'test', 'kit', 'cassette', 'bandelette']
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[95vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-light/20 p-2 rounded-xl">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-card-foreground">
              {product ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Informations générales */}
          <div className="bg-muted rounded-xl p-4 border border-border/50">
            <h3 className="font-medium text-foreground mb-4">Informations Générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Nom du produit"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Ex: Paracétamol 500mg"
                required
              />

              <FormField
                label="Catégorie"
                name="category"
                type="select"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormField>

              <FormField
                label="Fabricant"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                error={errors.manufacturer}
                placeholder="Ex: Pharma Cameroun"
                required
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">
                  Numéro de lot <span className="text-error ml-1">*</span>
                </label>
                <div className="flex space-x-2">
                  <FormField
                    label=""
                    name="batch_number"
                    value={formData.batch_number}
                    onChange={handleChange}
                    error={errors.batch_number}
                    placeholder="Ex: PC2024001"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={generateBatchNumber}
                    className="px-4 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all hover-lift text-sm font-medium"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <FormField
                label="Description"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description du produit, indications, etc."
                rows={2}
              />
            </div>
          </div>

          {/* Stock et prix */}
          <div className="bg-success-light rounded-xl p-4 border border-success/20">
            <h3 className="font-medium text-success mb-4">Stock et Prix</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                label="Stock actuel"
                name="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={handleChange}
                error={errors.current_stock}
                required
              />

              <FormField
                label="Stock minimum"
                name="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={handleChange}
                error={errors.min_stock}
                required
              />

              <FormField
                label="Prix unitaire (FCFA)"
                name="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={handleChange}
                error={errors.unit_price}
                required
              />

              <FormField
                label="Unité de mesure"
                name="unit"
                type="select"
                value={formData.unit}
                onChange={handleChange}
                error={errors.unit}
                required
              >
                <option value="">Sélectionner</option>
                {unitOptions[formData.category as keyof typeof unitOptions]?.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </FormField>
            </div>
          </div>

          {/* Localisation et expiration */}
          <div className="bg-warning-light rounded-xl p-4 border border-warning/20">
            <h3 className="font-medium text-warning mb-4">Localisation et Expiration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Emplacement"
                name="location"
                value={formData.location}
                onChange={handleChange}
                error={errors.location}
                placeholder="Ex: Pharmacie - Étagère A1"
                required
              />

              <FormField
                label="Date d'expiration"
                name="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={handleChange}
                error={errors.expiry_date}
                required
              />
            </div>
          </div>

          {/* Résumé */}
          {formData.name && formData.current_stock > 0 && formData.unit_price > 0 && (
            <div className="bg-info-light rounded-xl p-4 border border-info/30 animate-slide-down">
              <h3 className="font-medium text-info mb-2">Résumé</h3>
              <div className="text-sm text-info/90 space-y-1">
                <p><strong>Produit:</strong> {formData.name}</p>
                <p><strong>Stock:</strong> {formData.current_stock} {formData.unit}</p>
                <p><strong>Valeur totale:</strong> {(formData.current_stock * formData.unit_price).toLocaleString()} FCFA</p>
                {formData.current_stock <= formData.min_stock && (
                  <p className="text-warning"><strong>⚠️ Stock en dessous du minimum recommandé</strong></p>
                )}
              </div>
            </div>
          )}
          </div>

          <div className="p-6 pt-4 border-t border-border/50 bg-gradient-subtle">
            <FormActions
              onCancel={onClose}
              isSubmitting={isSubmitting}
              submitLabel={product ? 'Mettre à jour' : 'Ajouter le produit'}
            />
          </div>
        </form>
      </div>
    </div>
  );
}