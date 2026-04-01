import React from 'react';

const QuestionSettingsPanel = ({ block, onChange, onDelete }: any) => {
  // Placeholder: Show settings for the selected block
  return (
    <div className="w-80 border-l bg-white p-4">
      <h4 className="font-semibold mb-2">Question Settings</h4>
      {block ? (
        <div className="text-gray-600">Settings for selected question will appear here.</div>
      ) : (
        <div className="text-gray-400">Select a question to edit its settings.</div>
      )}
    </div>
  );
};

export default QuestionSettingsPanel;
