import { useState } from 'react';
import { useCustomers } from '../../stores/CustomerStore';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';

export const CustomersPage = () => {
  const { customers } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort customers alphabetically by name
  const sortedCustomers = [...filteredCustomers].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 size={32} />
            Customers
          </h1>
          <p className="text-slate-600 mt-2">
            Manage your customer database
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex justify-between items-center">
          <input
            type="search"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => {/* TODO: Open add modal */}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Customer
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
                    {searchQuery ? 'No customers found matching your search.' : 'No customers found. Click "Add Customer" to create one.'}
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
                        onClick={() => {/* TODO: Open edit modal */}}
                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                        title="Edit customer"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {/* TODO: Open delete confirmation */}}
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
      </div>
    </div>
  );
};
