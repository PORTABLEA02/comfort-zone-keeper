import { useState } from 'react';
import { InvoiceList } from './InvoiceList';
import { InvoiceFormPage } from './InvoiceFormPage';
import { InvoiceDetailPage } from './InvoiceDetailPage';
import { PaymentPage } from './PaymentPage';
import { BillingStats } from './BillingStats';
import { Database } from '../../lib/database.types';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  invoice_items?: any[];
};

type BillingView = 'list' | 'stats' | 'new' | 'detail' | 'edit' | 'payment';

export function BillingManager() {
  const [activeView, setActiveView] = useState<BillingView>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveView('detail');
  };

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setActiveView('new');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    if (invoice.status === 'paid') {
      alert('Cette facture ne peut pas être modifiée car elle a déjà été payée.');
      return;
    }
    setSelectedInvoice(invoice);
    setActiveView('edit');
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setActiveView('payment');
  };

  const handleBackToList = () => {
    setSelectedInvoice(null);
    setActiveView('list');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'new':
        return (
          <InvoiceFormPage
            onBack={handleBackToList}
          />
        );
      case 'edit':
        return selectedInvoice ? (
          <InvoiceFormPage
            invoice={selectedInvoice}
            onBack={handleBackToList}
          />
        ) : null;
      case 'detail':
        return selectedInvoice ? (
          <InvoiceDetailPage
            invoice={selectedInvoice}
            onBack={handleBackToList}
            onEdit={() => handleEditInvoice(selectedInvoice)}
            onPay={() => handlePayInvoice(selectedInvoice)}
          />
        ) : null;
      case 'payment':
        return selectedInvoice ? (
          <PaymentPage
            invoice={selectedInvoice}
            onBack={handleBackToList}
          />
        ) : null;
      case 'stats':
        return <BillingStats />;
      default:
        return (
          <InvoiceList
            onSelectInvoice={handleSelectInvoice}
            onNewInvoice={handleNewInvoice}
            onEditInvoice={handleEditInvoice}
            onPayInvoice={handlePayInvoice}
          />
        );
    }
  };

  // Show tabs only on list/stats views
  const showTabs = activeView === 'list' || activeView === 'stats';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation Tabs - Only visible on list/stats views */}
      {showTabs && (
        <div className="card-glass rounded-2xl shadow-card border border-border/50">
          <div className="border-b border-border/50">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveView('list')}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all ${
                  activeView === 'list'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >
                Factures
              </button>
              <button
                onClick={() => setActiveView('stats')}
                className={`py-4 px-2 border-b-3 font-semibold text-sm transition-all ${
                  activeView === 'stats'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'
                }`}
              >
                Statistiques
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
}
