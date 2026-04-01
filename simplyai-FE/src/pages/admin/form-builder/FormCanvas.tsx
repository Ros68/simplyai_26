import React from 'react';

const FormCanvas = ({ form, setForm, selectedBlock, setSelectedBlock }: any) => {
  // Placeholder: Render pages and blocks
  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <h4 className="font-semibold mb-4">Form Canvas (Drag questions here)</h4>
      {/* TODO: Render pages and blocks, support drag-and-drop */}
      <div className="text-gray-400 text-center mt-10">Drag question types from the left to add them here.</div>
    </div>
  );
};

export default FormCanvas;
