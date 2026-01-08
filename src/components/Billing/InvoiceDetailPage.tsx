import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard as Edit, CreditCard, Printer, User, DollarSign, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Tables } from '../../integrations/supabase/types';
import { PatientService } from '../../services/patients';
import { ClinicSettingsService } from '../../services/clinic-settings';

type Invoice = Tables<'invoices'> & {
  invoice_items?: Tables<'invoice_items'>[];
};
type Patient = Tables<'patients'>;

interface InvoiceDetailPageProps {
  invoice: Invoice;
  onBack: () => void;
  onEdit: () => void;
  onPay: () => void;
}

export function InvoiceDetailPage({ invoice, onBack, onEdit, onPay }: InvoiceDetailPageProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [clinicSettings, setClinicSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientInfo();
    loadClinicSettings();
  }, [invoice.patient_id]);

  const loadPatientInfo = async () => {
    try {
      setLoading(true);
      const patientData = await PatientService.getById(invoice.patient_id);
      setPatient(patientData as any);
    } catch (error) {
      console.error('Error loading patient info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClinicSettings = async () => {
    try {
      const settings = await ClinicSettingsService.getSettings();
      setClinicSettings(settings);
    } catch (error) {
      console.error('Error loading clinic settings:', error);
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return 'Non défini';
    const labels = {
      pending: 'En attente',
      paid: 'Payée',
      overdue: 'En retard'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-muted text-muted-foreground';
    const colors = {
      pending: 'bg-warning/20 text-warning',
      paid: 'bg-success/20 text-success',
      overdue: 'bg-error/20 text-error'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method?: string | null) => {
    if (!method) return '';
    const labels = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      'mobile-money': 'Mobile Money',
      'bank-transfer': 'Virement bancaire',
      'check': 'Chèque'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getInvoiceTypeLabel = (type?: string | null) => {
    if (!type) return 'Ordinaire';
    const labels = {
      'ordinary': 'Ordinaire',
      'general-consultation': 'Consultation générale',
      'gynecological-consultation': 'Consultation gynécologique'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handlePrint = () => {
    const printContent = generatePrintContent();
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Veuillez autoriser les pop-ups pour imprimer la facture');
      return;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  const generatePrintContent = () => {
    const currentDate = new Date().toLocaleDateString('fr-FR');
    const currentTime = new Date().toLocaleTimeString('fr-FR');

    const clinicName = clinicSettings?.clinic_name || 'Finagnon+';
    const clinicAddress = clinicSettings?.address || 'Yaoundé, Cameroun';
    const clinicPhone = clinicSettings?.phone || '+229 01 00 00 00 00';
    const clinicEmail = clinicSettings?.email || 'contact@finagnon.cm';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Facture - ${invoice.id}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: white; font-size: 14px; }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
            .clinic-subtitle { font-size: 16px; color: #666; margin-bottom: 15px; }
            .clinic-info { font-size: 14px; color: #666; line-height: 1.6; }
            .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; gap: 30px; }
            .invoice-info, .patient-info { flex: 1; background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
            .info-title { font-size: 16px; font-weight: bold; color: #2563eb; margin-bottom: 15px; text-transform: uppercase; }
            .info-item { margin-bottom: 8px; font-size: 14px; }
            .info-label { font-weight: bold; color: #555; }
            .invoice-number { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th { background: #2563eb; color: white; padding: 15px; text-align: left; font-weight: bold; }
            .items-table td { padding: 12px 15px; border-bottom: 1px solid #e5e7eb; }
            .items-table tr:nth-child(even) { background: #f8f9fa; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-section { background: #f8f9fa; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px; max-width: 400px; margin-left: auto; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
            .total-row.final { border-top: 2px solid #2563eb; padding-top: 15px; margin-top: 15px; font-size: 18px; font-weight: bold; color: #2563eb; }
            .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; }
            @media print { body { margin: 0; padding: 15px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="clinic-name">${clinicName}</div>
            <div class="clinic-subtitle">Système de Gestion Médicale</div>
            <div class="clinic-info">${clinicAddress}<br>Tél: ${clinicPhone} | Email: ${clinicEmail}</div>
          </div>
          <div class="invoice-header">
            <div class="invoice-info">
              <div class="info-title">Informations Facture</div>
              <div class="invoice-number">${invoice.id}</div>
              <div class="info-item"><span class="info-label">Date d'émission:</span> ${new Date(invoice.date).toLocaleDateString('fr-FR')}</div>
              <div class="info-item"><span class="info-label">Type de facture:</span> ${getInvoiceTypeLabel(invoice.invoice_type)}</div>
              <div class="info-item"><span class="info-label">Statut:</span> ${getStatusLabel(invoice.status)}</div>
              ${invoice.paid_at ? `<div class="info-item"><span class="info-label">Payée le:</span> ${new Date(invoice.paid_at).toLocaleDateString('fr-FR')}</div>` : ''}
              ${invoice.payment_method ? `<div class="info-item"><span class="info-label">Mode de paiement:</span> ${getPaymentMethodLabel(invoice.payment_method)}</div>` : ''}
            </div>
            <div class="patient-info">
              <div class="info-title">Informations Patient</div>
              <div class="info-item"><span class="info-label">Nom complet:</span> ${patient?.first_name} ${patient?.last_name}</div>
              <div class="info-item"><span class="info-label">Téléphone:</span> ${patient?.phone}</div>
              ${patient?.email ? `<div class="info-item"><span class="info-label">Email:</span> ${patient.email}</div>` : ''}
              ${patient?.address ? `<div class="info-item"><span class="info-label">Adresse:</span> ${patient.address}</div>` : ''}
            </div>
          </div>
          <table class="items-table">
            <thead><tr><th>Description</th><th class="text-center">Quantité</th><th class="text-right">Prix unitaire</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              ${invoice.invoice_items?.map(item => `<tr><td>${item.description}</td><td class="text-center">${item.quantity}</td><td class="text-right">${item.unit_price.toLocaleString()} FCFA</td><td class="text-right">${item.total.toLocaleString()} FCFA</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="totals-section">
            <div class="total-row"><span>Sous-total:</span><span>${invoice.subtotal.toLocaleString()} FCFA</span></div>
            ${invoice.tax > 0 ? `<div class="total-row"><span>Taxes:</span><span>${invoice.tax.toLocaleString()} FCFA</span></div>` : ''}
            <div class="total-row final"><span>TOTAL:</span><span>${invoice.total.toLocaleString()} FCFA</span></div>
          </div>
          <div class="footer">
            <div>Facture générée le ${currentDate} à ${currentTime}</div>
            <div>${clinicName} - Système de Gestion Médicale</div>
            <div>Merci de votre confiance</div>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-success-light p-2 rounded-xl">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-card-foreground">Détail de la Facture</h1>
                <p className="text-sm text-muted-foreground">{invoice.id}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {invoice.status !== 'paid' && (
              <button
                onClick={onPay}
                className="btn-primary px-4 py-2 rounded-xl flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Enregistrer paiement</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer</span>
            </button>
            {invoice.status !== 'paid' ? (
              <button
                onClick={onEdit}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            ) : (
              <div className="bg-muted text-muted-foreground px-4 py-2 rounded-xl flex items-center space-x-2 cursor-not-allowed">
                <Edit className="h-4 w-4" />
                <span>Facture payée</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations facture */}
        <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-medium text-foreground">Informations Facture</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Numéro:</span>
              <p className="text-foreground font-medium">{invoice.id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Date d'émission:</span>
              <p className="text-foreground">{new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Type de facture:</span>
              <p className="text-foreground">{getInvoiceTypeLabel(invoice.invoice_type)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Statut:</span>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1">{getStatusLabel(invoice.status)}</span>
                </span>
              </div>
            </div>
            {invoice.paid_at && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Payée le:</span>
                <p className="text-foreground">{new Date(invoice.paid_at).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
            {invoice.payment_method && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Mode de paiement:</span>
                <p className="text-foreground">{getPaymentMethodLabel(invoice.payment_method)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Informations patient */}
        <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-success" />
            <h3 className="font-medium text-foreground">Informations Patient</h3>
          </div>
          
          {patient && (
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Nom complet:</span>
                <p className="text-foreground font-medium">{patient?.first_name} {patient?.last_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Téléphone:</span>
                <p className="text-foreground">{patient?.phone}</p>
              </div>
              {patient?.email && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Email:</span>
                  <p className="text-foreground">{patient.email}</p>
                </div>
              )}
              {patient?.address && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Adresse:</span>
                  <p className="text-foreground">{patient.address}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Services et prestations */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
        <h3 className="font-medium text-foreground mb-4">Services et Prestations</h3>
        
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Description</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Quantité</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Prix unitaire</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.invoice_items?.map((item, index) => (
                <tr key={index} className="hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm text-foreground">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-center">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-right">{item.unit_price.toLocaleString()} FCFA</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground text-right">{item.total.toLocaleString()} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totaux */}
      <div className="card-glass rounded-2xl shadow-card border border-border/50 p-6">
        <h3 className="font-medium text-foreground mb-4">Récapitulatif des Montants</h3>
        
        <div className="bg-card rounded-xl p-4 border border-border max-w-md ml-auto">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total:</span>
              <span className="font-medium text-foreground">{invoice.subtotal.toLocaleString()} FCFA</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes:</span>
                <span className="font-medium text-foreground">{invoice.tax.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">TOTAL:</span>
                <span className="text-success">{invoice.total.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
