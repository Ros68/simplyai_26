import React from "react";

const QUESTION_TYPES = [
  { type: "text", label: "Text" },
  { type: "radio", label: "Single Choice" },
  { type: "checkbox", label: "Multiple Choice" },
  { type: "rating", label: "Rating" },
  { type: "slider", label: "Range Slider" },
  { type: "currency", label: "Currency" },
  { type: "table", label: "Table" },
  { type: "file", label: "File Upload" },
];

const QuestionToolbox = ({
  onAddQuestionType,
}: {
  onAddQuestionType: (type: string) => void;
}) => (
  <div>
    <h3 className="font-semibold mb-2">Question Types</h3>
    <div className="flex flex-col gap-2">
      {QUESTION_TYPES.map((q) => (
        <button
          key={q.type}
          className="w-full px-3 py-2 bg-white border rounded hover:bg-[var(--color-primary-50)] text-left text-sm"
          onClick={() => onAddQuestionType(q.type)}
          type="button"
        >
          {q.label}
        </button>
      ))}
    </div>
  </div>
);

export default QuestionToolbox;
