"use client";

import { useEffect, useState } from "react";
import { Play, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface TemplateParameter {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface TemplateStep {
  agent: string;
  task: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  parameters: TemplateParameter[];
  steps: TemplateStep[];
}

export default function WorkflowsPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const openLaunchModal = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setFormValues({});
    setLaunchResult(null);
  };

  const closeModal = () => {
    setSelectedTemplate(null);
    setFormValues({});
    setLaunchResult(null);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleLaunch = async () => {
    if (!selectedTemplate) return;
    
    setLaunching(true);
    setLaunchResult(null);
    
    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parameters: formValues }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setLaunchResult({ success: true, message: data.message || "Workflow launched!" });
        setTimeout(() => closeModal(), 2000);
      } else {
        setLaunchResult({ success: false, message: data.error || "Failed to launch" });
      }
    } catch (error) {
      setLaunchResult({ success: false, message: "Failed to launch workflow" });
    } finally {
      setLaunching(false);
    }
  };

  const isFormValid = () => {
    if (!selectedTemplate) return false;
    return selectedTemplate.parameters
      .filter(p => p.required)
      .every(p => formValues[p.key]?.trim());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Workflow Templates
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Launch predefined workflows to automate common tasks
        </p>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1rem"
      }}>
        {templates.map(template => (
          <div
            key={template.id}
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "2rem" }}>{template.icon}</span>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: "1.1rem" }}>{template.name}</h3>
                {template.category && (
                  <span style={{ 
                    fontSize: "0.75rem", 
                    color: "var(--text-muted)",
                    background: "var(--bg-secondary)",
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }}>
                    {template.category}
                  </span>
                )}
              </div>
            </div>
            
            <p style={{ 
              color: "var(--text-muted)", 
              fontSize: "0.9rem", 
              flex: 1,
              marginBottom: "1rem"
            }}>
              {template.description}
            </p>
            
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginTop: "auto" 
            }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {template.steps.length} step{template.steps.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => openLaunchModal(template)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                }}
              >
                <Play size={16} />
                Launch
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Launch Modal */}
      {selectedTemplate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.5rem",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{selectedTemplate.icon}</span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>{selectedTemplate.name}</h2>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "var(--text-muted)",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {selectedTemplate.parameters.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {selectedTemplate.parameters.map(param => (
                  <div key={param.key}>
                    <label style={{ 
                      display: "block", 
                      marginBottom: "0.5rem", 
                      fontWeight: 500,
                      fontSize: "0.9rem"
                    }}>
                      {param.label}
                      {param.required && <span style={{ color: "var(--danger)" }}> *</span>}
                    </label>
                    {param.type === "select" ? (
                      <select
                        value={formValues[param.key] || ""}
                        onChange={e => handleInputChange(param.key, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          color: "var(--text)",
                          fontSize: "0.9rem",
                        }}
                      >
                        <option value="">Select...</option>
                        {param.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : param.type === "textarea" ? (
                      <textarea
                        value={formValues[param.key] || ""}
                        onChange={e => handleInputChange(param.key, e.target.value)}
                        placeholder={param.placeholder}
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          color: "var(--text)",
                          fontSize: "0.9rem",
                          resize: "vertical",
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={formValues[param.key] || ""}
                        onChange={e => handleInputChange(param.key, e.target.value)}
                        placeholder={param.placeholder}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "6px",
                          color: "var(--text)",
                          fontSize: "0.9rem",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
                This template has no parameters. Click Launch to start.
              </p>
            )}

            {launchResult && (
              <div style={{
                marginTop: "1rem",
                padding: "0.75rem",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: launchResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                color: launchResult.success ? "var(--success)" : "var(--danger)",
              }}>
                {launchResult.success ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {launchResult.message}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "0.625rem 1.25rem",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching || !isFormValid()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: launching || !isFormValid() ? "var(--text-muted)" : "var(--accent)",
                  color: "var(--accent-foreground)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: launching || !isFormValid() ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
              >
                {launching ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {launching ? "Launching..." : "Launch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
