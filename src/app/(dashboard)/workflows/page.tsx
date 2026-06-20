"use client";

import { useEffect, useState } from "react";
import { Play, X, Loader2, CheckCircle, AlertCircle, Radio, Layers } from "lucide-react";
import { CommandBar } from "@/components/CommandBar";
import { ActiveWorkflows } from "@/components/ActiveWorkflows";

interface TemplateParameter {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  parameters: TemplateParameter[];
  steps: Array<{ agent: string; task: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  marketing: "📣 Marketing",
  development: "⚙️ Development",
  research: "🔍 Research",
};

const CATEGORY_ORDER = ["marketing", "development", "research"];

export default function WorkflowsPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dispatchRefresh, setDispatchRefresh] = useState(0);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...CATEGORY_ORDER.filter((c) =>
    templates.some((t) => t.category === c)
  )];

  const filtered = selectedCategory === "all"
    ? templates
    : templates.filter((t) => t.category === selectedCategory);

  // Group by category for "all" view
  const grouped = CATEGORY_ORDER.reduce<Record<string, WorkflowTemplate[]>>((acc, cat) => {
    const items = filtered.filter((t) => t.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  const uncategorized = filtered.filter((t) => !t.category || !CATEGORY_ORDER.includes(t.category));

  const openLaunch = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setFormValues({});
    setLaunchResult(null);
  };

  const closeModal = () => {
    setSelectedTemplate(null);
    setFormValues({});
    setLaunchResult(null);
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
        setDispatchRefresh((n) => n + 1);
        setTimeout(closeModal, 2000);
      } else {
        setLaunchResult({ success: false, message: data.error || "Failed to launch" });
      }
    } catch {
      setLaunchResult({ success: false, message: "Failed to launch workflow" });
    } finally {
      setLaunching(false);
    }
  };

  const isFormValid = () =>
    !!selectedTemplate &&
    selectedTemplate.parameters
      .filter((p) => p.required)
      .every((p) => formValues[p.key]?.trim());

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-5">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)", letterSpacing: "-1px" }}
        >
          <Layers className="inline-block w-6 h-6 mr-2 mb-1" />
          Workflows
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Launch multi-step agent workflows or dispatch a quick task below.
        </p>
      </div>

      {/* Top row: command bar + live queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CommandBar
          placeholder="Quick dispatch — describe a task for any agent…"
          onDispatched={() => setDispatchRefresh((n) => n + 1)}
        />
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Radio className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
            >
              Recent Dispatches
            </span>
          </div>
          <ActiveWorkflows limit={5} refreshTrigger={dispatchRefresh} showHeader />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              backgroundColor: selectedCategory === cat ? "var(--accent)" : "var(--card)",
              color: selectedCategory === cat ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${selectedCategory === cat ? "var(--accent)" : "var(--border)"}`,
              cursor: "pointer",
              fontFamily: "var(--font-heading)",
            }}
          >
            {cat === "all" ? "All Templates" : CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
        <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>
          {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      ) : (
        <div>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-6">
              {selectedCategory === "all" && (
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((t) => (
                  <TemplateCard key={t.id} template={t} onLaunch={() => openLaunch(t)} />
                ))}
              </div>
            </div>
          ))}
          {uncategorized.length > 0 && (
            <div className="mb-6">
              {selectedCategory === "all" && (
                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                  Other
                </h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {uncategorized.map((t) => (
                  <TemplateCard key={t.id} template={t} onLaunch={() => openLaunch(t)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Launch Modal */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={closeModal}
        >
          <div
            className="rounded-xl overflow-hidden w-full mx-4"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              maxWidth: 540,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div>
                  <h2
                    className="font-semibold text-base"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                  >
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {selectedTemplate.steps.length} agent step{selectedTemplate.steps.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded"
                style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step preview */}
            <div className="px-6 py-3" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--card-elevated)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                Steps
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.steps.map((step, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {i + 1}. {step.agent}
                  </span>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-4">
              {selectedTemplate.parameters.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {selectedTemplate.parameters.map((param) => (
                    <div key={param.key}>
                      <label
                        className="block mb-1.5 text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {param.label}
                        {param.required && <span style={{ color: "var(--negative)" }}> *</span>}
                      </label>
                      {param.type === "select" ? (
                        <select
                          value={formValues[param.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [param.key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: "var(--card-elevated)",
                            border: "1px solid var(--border)",
                            color: formValues[param.key] ? "var(--text-primary)" : "var(--text-muted)",
                            outline: "none",
                          }}
                        >
                          <option value="">Select…</option>
                          {param.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : param.type === "textarea" ? (
                        <textarea
                          value={formValues[param.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [param.key]: e.target.value }))}
                          placeholder={param.placeholder}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                          style={{
                            backgroundColor: "var(--card-elevated)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={formValues[param.key] || ""}
                          onChange={(e) => setFormValues((p) => ({ ...p, [param.key]: e.target.value }))}
                          placeholder={param.placeholder}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{
                            backgroundColor: "var(--card-elevated)",
                            border: "1px solid var(--border)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
                  No parameters needed — ready to launch.
                </p>
              )}

              {launchResult && (
                <div
                  className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                  style={{
                    backgroundColor: launchResult.success ? "var(--positive-soft)" : "rgba(239,68,68,0.1)",
                    color: launchResult.success ? "var(--positive)" : "var(--negative)",
                    border: `1px solid ${launchResult.success ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                  }}
                >
                  {launchResult.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {launchResult.message}
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              className="px-6 py-4 flex items-center justify-end gap-3"
              style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--card-elevated)" }}
            >
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching || !isFormValid()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  opacity: launching || !isFormValid() ? 0.5 : 1,
                  cursor: launching || !isFormValid() ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {launching ? "Launching…" : "Launch Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, onLaunch }: { template: WorkflowTemplate; onLaunch: () => void }) {
  const isMarketing = template.category === "marketing";
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col transition-all"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = isMarketing ? "#F59E0B" : "var(--accent)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLElement).style.transform = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      <div className="p-4 flex-1">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl flex-shrink-0">{template.icon}</span>
          <div>
            <h3
              className="font-semibold text-sm leading-tight mb-1"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
            >
              {template.name}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: isMarketing ? "rgba(245,158,11,0.12)" : "rgba(14,165,233,0.12)",
                  color: isMarketing ? "#F59E0B" : "var(--accent)",
                  fontWeight: 600,
                }}
              >
                {template.steps.length} steps
              </span>
              {template.category && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {template.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {template.description}
        </p>
      </div>

      {/* Step agents */}
      <div className="px-4 pb-2 flex flex-wrap gap-1">
        {template.steps.slice(0, 5).map((step, i) => (
          <span
            key={i}
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {step.agent}
          </span>
        ))}
        {template.steps.length > 5 && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{template.steps.length - 5}</span>
        )}
      </div>

      <div
        className="px-4 py-3"
        style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--card-elevated)" }}
      >
        <button
          onClick={onLaunch}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold"
          style={{
            backgroundColor: isMarketing ? "#F59E0B" : "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-heading)",
          }}
        >
          <Play className="w-3.5 h-3.5" />
          Launch
        </button>
      </div>
    </div>
  );
}
