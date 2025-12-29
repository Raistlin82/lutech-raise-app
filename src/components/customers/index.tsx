import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomers } from '../../stores/CustomerStore';
import { useOpportunities } from '../../stores/OpportunitiesStore';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { CustomerModal } from './CustomerModal';
import type { Customer } from '../../types';

export const CustomersPage = () => {
  const { t } = useTranslation('customers');
  const { t: tCommon } = useTranslation('common');
  const { customers, deleteCustomer } = useCustomers();
  const { opportunities } = useOpportunities();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort customers alphabetically by name
  const sortedCustomers = [...filteredCustomers].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Modal handlers
  const openAddModal = () => {
    setEditingCustomer(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    // Check if customer has opportunities (using clientName for now, will use customerId after migration)
    const hasOpportunities = opportunities.some(
      opp => opp.clientName?.toLowerCase() === customer.name.toLowerCase()
    );

    if (hasOpportunities) {
      alert(
        `Cannot delete "${customer.name}" because it has active opportunities. ` +
        `Please delete or reassign those opportunities first.`
      );
      return;
    }

    if (confirm(t('actions.deleteConfirm'))) {
      deleteCustomer(customer.id);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 size={32} />
            {t('title')}
          </h1>
          <p className="text-slate-600 mt-2">
            {t('subtitle')}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <input
            type="search"
            placeholder={t('list.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            {t('actions.add')}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Public Sector
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    {searchQuery ? t('list.empty') : t('list.addFirst')}
                  </td>
                </tr>
              ) : (
                sortedCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {customer.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.isPublicSector ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-slate-300">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                        title="Edit customer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Customer Modal */}
        <CustomerModal
          isOpen={isModalOpen}
          onClose={closeModal}
          customer={editingCustomer}
        />
      </div>
    </div>
  );
};
