import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Customer, Industry } from '../../types';
import { useCustomers } from '../../stores/CustomerStore';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer; // Undefined = Add mode, Defined = Edit mode
}

const INDUSTRIES: Industry[] = [
  'Technology',
  'Manufacturing',
  'Finance',
  'Healthcare',
  'Retail',
  'Energy',
  'Transportation',
  'Public Administration',
  'Telecommunications',
  'Consulting',
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { addCustomer, updateCustomer } = useCustomers();
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Technology' as Industry,
    isPublicSector: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/customer changes
  useEffect(() => {
    if (customer) {
      // Edit mode - populate from customer
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: customer.name,
        industry: customer.industry,
        isPublicSector: customer.isPublicSector,
      });
    } else {
      // Add mode - reset to defaults
      setFormData({
        name: '',
        industry: 'Technology',
        isPublicSector: false,
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Name must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (customer) {
      // Edit mode
      updateCustomer({
        ...customer,
        ...formData,
      });
    } else {
      // Add mode
      addCustomer(formData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {customer ? 'Edit Customer' : 'Add Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Acme Corporation"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Industry *
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value as Industry }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Public Sector */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublicSector"
              checked={formData.isPublicSector}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublicSector: e.target.checked }))}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isPublicSector" className="ml-2 text-sm text-slate-700">
              Public Sector
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {customer ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
