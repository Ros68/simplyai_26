import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config/api";

interface FormSummary {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  status: string;
}

const PublishedFormsPage = () => {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/forms`);
        if (!res.ok) throw new Error("Failed to fetch forms");
        const data = await res.json();
        setForms(data.forms || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Published Forms</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-4">
        {forms
          .filter((f) => f.status === "published")
          .map((form) => (
            <li key={form.id} className="border rounded p-4 bg-white shadow">
              <div className="font-semibold text-lg">{form.title}</div>
              {form.description && (
                <div className="text-gray-600 mb-2">{form.description}</div>
              )}
              <Button asChild variant="outline">
                <a href={`/admin/FormEditorPage?id=${form.id}`}>View / Edit</a>
              </Button>
            </li>
          ))}
      </ul>
      {!loading &&
        forms.filter((f) => f.status === "published").length === 0 && (
          <div>No published forms found.</div>
        )}
    </div>
  );
};

export default PublishedFormsPage;
