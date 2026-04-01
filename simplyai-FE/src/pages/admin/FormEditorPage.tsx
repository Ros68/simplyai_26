import React, { useState } from "react";
import QuestionToolbox from "./form-builder/QuestionToolbox";
import FormCanvas from "./form-builder/FormCanvas";
import QuestionSettingsPanel from "./form-builder/QuestionSettingsPanel";
import FormImportExport from "./form-builder/FormImportExport";
import FormPreview from "./form-builder/FormPreview";
import { Button } from "@/components/ui/button";

// Initial empty form structure
const initialForm = {
  title: "",
  description: "", // Added description field
  instructions: "", // Added instructions field
  pages: [
    {
      id: "page-1",
      title: "Page 1",
      blocks: [],
    },
  ],
};

const FormEditorPage = () => {
  const [form, setForm] = useState(initialForm);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Handler for updating form title, description, and instructions
  const handleFormMetaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveForm = async () => {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "https://simplyai.it/api";

    // Save to backend API_BASE_URL/forms (MySQL, no auth)
    const res = await fetch(`${API_BASE_URL}/forms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: form.title || "Untitled Form",
        description: form.description || "",
        instructions: form.instructions || "",
        questions: form.pages,
        status: "published",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert("Error saving form: " + (data.message || "Unknown error"));
    } else {
      alert("Form saved successfully!");
    }
  };

  // Handlers for toolbox, canvas, settings, import/export, etc.
  // ...to be implemented...

  return (
    <div className="flex h-screen">
      {/* Toolbox Sidebar */}
      <div className="w-64 border-r bg-gray-50 p-4">
        <QuestionToolbox
          onAddQuestionType={(type) => {
            /* ... */
          }}
        />
        <div className="mt-8">
          <FormImportExport form={form} setForm={setForm} />
        </div>
      </div>
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h2 className="text-xl font-bold">Form Editor</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => setPreviewMode((pm) => !pm)}
              variant="outline"
            >
              {previewMode ? "Editor" : "Preview"}
            </Button>
            <Button onClick={handleSaveForm} variant="default">
              Save Form
            </Button>
          </div>
        </div>
        {/* Form Metadata Fields */}
        <div className="p-4 border-b bg-gray-50 flex flex-col gap-3">
          <input
            className="border rounded px-3 py-2 text-lg font-semibold"
            type="text"
            placeholder="Form Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="border rounded px-3 py-2"
            placeholder="Form Description (optional)"
            value={form.description || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={2}
          />
          <textarea
            className="border rounded px-3 py-2"
            placeholder="Form Instructions (optional)"
            value={form.instructions || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, instructions: e.target.value }))
            }
            rows={2}
          />
        </div>
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas or Preview */}
          {previewMode ? (
            <FormPreview form={form} />
          ) : (
            <FormCanvas
              form={form}
              setForm={setForm}
              selectedBlock={selectedBlock}
              setSelectedBlock={setSelectedBlock}
            />
          )}
          {/* Settings Panel */}
          <QuestionSettingsPanel
            block={selectedBlock}
            onChange={(updatedBlock) => {
              /* ... */
            }}
            onDelete={() => {
              /* ... */
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FormEditorPage;
