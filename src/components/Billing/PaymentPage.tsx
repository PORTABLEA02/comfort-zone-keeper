import React, { useState } from 'react';
import { ArrowLeft, Save, CreditCard, DollarSign, CheckCircle } from 'lucide-react';
import { Database } from '../../integrations/supabase/types';
import { usePatients } from '../../hooks/queries/usePatients';
import { useAddPayment } from '../../hooks/queries/useInvoices';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useConfirm } from '../../hooks/useConfirm';

type Invoice = Database['public']['Tables']['invoices']['Row'];

interface PaymentPageProps {
  invoice: Invoice;
  onBack: () => void;
}

export function PaymentPage({ invoice, onBack }: PaymentPageProps) {
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash' as 'cash' | 'card' | 'mobile-money' | 'bank-transfer' | 'check',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  
  const { data: patients = [] } = usePatients();
  const addPayment = useAddPayment();
  
  const patient = patients.find(p => p.id === invoice.patient_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const confirmed = await confirm({
      title: 'Confirmer le paiement',
      message: `Confirmer l'enregistrement du paiement de ${invoice.total.toLocaleString()} FCFA pour ${patient?.first_name} ${patient?.last_name} ?`,
      type: 'success',
      confirmText: 'Enregistrer le paiement',
      cancelText: 'Annuler'
    });
    
    if (confirmed && !addPayment.isPending) {
      try {
        await addPayment.mutateAsync({
          invoice_id: invoice.id,
          amount: invoice.total,
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date,
          notes: paymentData.notes || null,
          reference: null
        });
        onBack();
      } catch (error) {
        console.error('Error processing payment:', error);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentData({ 
      ...paymentData, 
      [name]: name === 'payment_method' ? value as typeof paymentData.payment_method : value 
    });
  };

  const paymentMethods = [
    { value: 'cash' as const, label: 'Espèces', icon: '💵' },
    { value: 'card' as const, label: 'Carte bancaire', icon: '💳' },
    { value: 'mobile-money' as const, label: 'Mobile Money', icon: '📱' },
    { value: 'bank-transfer' as const, label: 'Virement bancaire', icon: '🏦' },
    { value: 'check' as const, label: 'Chèque', icon: '📝' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            disabled={addPayment.isPending}
            className="p-2 hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-success-light p-2 rounded-xl">
              <CreditCard className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">Enregistrer un Paiement</h1>
              <p className="text-sm text-muted-foreground">Facture: {invoice.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Informations facture */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Informations de la Facture</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Patient:</span>
                  <p className="text-foreground font-medium">{patient?.first_name} {patient?.last_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Montant total:</span>
                  <p className="text-foreground font-bold text-lg">{invoice.total.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Date facture:</span>
                  <p className="text-foreground">{new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Statut actuel:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-success/20 text-success' :
                    invoice.status === 'overdue' ? 'bg-error/20 text-error' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {invoice.status === 'paid' ? 'Payée' : 
                     invoice.status === 'overdue' ? 'En retard' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Détails du paiement */}
            <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6 mb-6">
              <h3 className="font-medium text-foreground mb-4">Détails du Paiement</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date de paiement *
                  </label>
                  <input
                    type="date"
                    name="payment_date"
                    value={paymentData.payment_date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                    disabled={addPayment.isPending}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Mode de paiement *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.value}
                        className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                          paymentData.payment_method === method.value
                            ? 'border-success bg-success/10'
                            : 'border-border hover:bg-muted'
                        } ${addPayment.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.value}
                          checked={paymentData.payment_method === method.value}
                          onChange={handleChange}
                          disabled={addPayment.isPending}
                          className="text-success focus:ring-success"
                        />
                        <span className="text-lg">{method.icon}</span>
                        <span className="text-sm font-medium text-foreground">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes complémentaires
                  </label>
                  <textarea
                    name="notes"
                    value={paymentData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Informations supplémentaires sur le paiement..."
                    disabled={addPayment.isPending}
                    className="w-full px-3 py-2 border border-input rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Indicateur de traitement */}
            {addPayment.isPending && (
              <div className="card-glass rounded-2xl shadow-card border border-primary/50 p-6 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <div>
                    <p className="text-sm font-medium text-primary">Traitement du paiement en cours...</p>
                    <p className="text-xs text-muted-foreground">Veuillez patienter, ne fermez pas cette page.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onBack}
                disabled={addPayment.isPending}
                className="px-6 py-2 text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={addPayment.isPending}
                className="px-6 py-2 btn-primary rounded-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{addPayment.isPending ? 'Enregistrement...' : 'Enregistrer le paiement'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6 sticky top-6">
            <h3 className="font-medium text-foreground mb-4">Récapitulatif du Paiement</h3>
            
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Montant facture:</span>
                  <span className="font-medium text-foreground">{invoice.total.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mode de paiement:</span>
                  <span className="font-medium text-foreground">
                    {paymentMethods.find(m => m.value === paymentData.payment_method)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">{new Date(paymentData.payment_date).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-success/10 rounded-xl flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">
                Cette facture sera marquée comme entièrement payée
              </span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isLoading={confirmState.isLoading}
      />
    </div>
  );
}
