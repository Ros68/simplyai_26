import React from 'react';

const FormImportExport = ({ form, setForm }: any) => {
  // Placeholder: Import/export buttons
  return (
    <div className="space-y-2">
      <button className="w-full px-3 py-2 bg-white border rounded hover:bg-[var(--color-primary-50)] text-sm">Import JSON/CSV</button>
      <button className="w-full px-3 py-2 bg-white border rounded hover:bg-[var(--color-primary-50)] text-sm">Export JSON/CSV</button>
    </div>
  );
};

export default FormImportExport;
