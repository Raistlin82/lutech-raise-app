import { useState } from 'react';

export function MigrationWarning() {
  // Initialize state by checking localStorage once
  const [hasLocalData, setHasLocalData] = useState(() => {
    const hasData =
      localStorage.getItem('raise_opportunities') ||
      localStorage.getItem('raise_customers');
    return !!hasData;
  });

  if (!hasLocalData) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
      <h3 className="font-bold text-yellow-900">Migration Notice</h3>
      <p className="text-yellow-800">
        Your data has been migrated to the cloud.
        Old local data will be automatically cleared on next login.
      </p>
      <button
        onClick={() => {
          localStorage.clear();
          setHasLocalData(false);
        }}
        className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded"
      >
        Clear Old Data Now
      </button>
    </div>
  );
}
