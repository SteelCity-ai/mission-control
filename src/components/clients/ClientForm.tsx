"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import type { Client } from "@/lib/social/clientService";

interface ClientWithSettings extends Client {
  platforms?: string[];
  outreachTargets?: { likes: number; comments: number };
}

const INDUSTRIES = [
  { value: "pest-control", label: "Pest Control" },
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "automotive", label: "Automotive" },
  { value: "professional-services", label: "Professional Services" },
  { value: "other", label: "Other" },
];

const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "nextdoor", label: "Nextdoor" },
  { id: "gmb", label: "Google Business" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

interface FormData {
  // Step 1: Basics
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  // Step 2: Brand
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  // Step 3: Platforms
  platforms: string[];
  outreachLikes: number;
  outreachComments: number;
}

const DEFAULT_FORM: FormData = {
  name: "",
  slug: "",
  contactEmail: "",
  contactPhone: "",
  industry: "",
  primaryColor: "#0ea5e9",
  secondaryColor: "#6366f1",
  logoUrl: "",
  platforms: ["facebook", "instagram"],
  outreachLikes: 25,
  outreachComments: 5,
};

interface Props {
  client?: ClientWithSettings | null;   // null = create mode, ClientWithSettings = edit mode
  onSave: (client: ClientWithSettings) => void;
  onClose: () => void;
}

const STEPS = ["Basics", "Brand", "Platforms"];

export function ClientForm({ client, onSave, onClose }: Props) {
  const isEditing = !!client;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [slugManual, setSlugManual] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "global", string>>>({});
  const [saving, setSaving] = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        slug: client.slug,
        contactEmail: client.contactEmail ?? "",
        contactPhone: client.contactPhone ?? "",
        industry: client.industry ?? "",
        primaryColor: client.branding?.primaryColor ?? "#0ea5e9",
        secondaryColor: client.branding?.secondaryColor ?? "#6366f1",
        logoUrl: client.branding?.logoUrl ?? "",
        platforms: client.platforms ?? ["facebook", "instagram"],
        outreachLikes: client.outreachTargets?.likes ?? 25,
        outreachComments: client.outreachTargets?.comments ?? 5,
      });
      setSlugManual(true); // don't auto-update slug when editing
    } else {
      setForm(DEFAULT_FORM);
      setSlugManual(false);
    }
    setStep(0);
    setErrors({});
  }, [client]);

  const update = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: val };
      // Auto-generate slug from name unless manually set
      if (key === "name" && !slugManual) {
        next.slug = slugify(val as string);
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const togglePlatform = (p: string) => {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));
  };

  const validateStep = (): boolean => {
    const errs: typeof errors = {};
    if (step === 0) {
      if (!form.name.trim()) errs.name = "Name is required.";
      if (!form.slug.trim()) errs.slug = "Slug is required.";
      else if (!/^[a-z0-9-]+$/.test(form.slug)) errs.slug = "Only lowercase letters, numbers, hyphens.";
      if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
        errs.contactEmail = "Invalid email address.";
      }
    }
    if (step === 2) {
      if (form.platforms.length === 0) errs.platforms = "Select at least one platform.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    setErrors({});

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      industry: form.industry || undefined,
      branding: {
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        logoUrl: form.logoUrl.trim() || undefined,
      },
      platforms: form.platforms,
      outreachTargets: {
        likes: form.outreachLikes,
        comments: form.outreachComments,
      },
    };

    try {
      const url = isEditing ? `/api/clients/${client!.id}` : "/api/clients";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === "CONFLICT") {
          setErrors({ slug: "This slug is already taken. Choose a different one." });
          setStep(0);
        } else {
          setErrors({ global: err.message ?? "Failed to save client." });
        }
        return;
      }

      const saved: ClientWithSettings = await res.json();
      onSave(saved);
    } catch {
      setErrors({ global: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    padding: "10px 12px",
    fontSize: "13px",
    color: "var(--text-primary)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "var(--font-body)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--text-muted)",
    marginBottom: "6px",
  };

  const fieldErrStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "var(--negative)",
    marginTop: "4px",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(3px)",
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "560px",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 64px)",
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {isEditing ? `Edit ${client!.name}` : "Add New Client"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", borderRadius: "6px" }}
          >
            <X style={{ width: "18px", height: "18px" }} />
          </button>
        </div>

        {/* Step progress */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: "0", position: "relative" }}>
            {/* Progress line */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                right: "14px",
                height: "2px",
                backgroundColor: "var(--border)",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                width: `${(step / (STEPS.length - 1)) * (100 - 14 / 2)}%`,
                height: "2px",
                backgroundColor: "var(--accent)",
                zIndex: 1,
                transition: "width 0.3s ease",
              }}
            />

            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={i}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", position: "relative", zIndex: 2 }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: done || active ? "var(--accent)" : "var(--surface)",
                      border: `2px solid ${done || active ? "var(--accent)" : "var(--border)"}`,
                      color: done || active ? "#fff" : "var(--text-muted)",
                      fontSize: "12px",
                      fontWeight: 700,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {done ? <Check style={{ width: "13px", height: "13px" }} /> : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: active ? 600 : 400,
                      color: active ? "var(--accent)" : done ? "var(--text-secondary)" : "var(--text-muted)",
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {errors.global && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "var(--negative-soft)",
                border: "1px solid var(--negative)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                color: "var(--negative)",
                marginBottom: "16px",
              }}
            >
              {errors.global}
            </div>
          )}

          {/* Step 1: Basics */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Client Name *</label>
                <input
                  type="text"
                  placeholder="Absolute Pest Services"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.name ? "var(--negative)" : "var(--border)" }}
                />
                {errors.name && <p style={fieldErrStyle}>{errors.name}</p>}
              </div>

              <div>
                <label style={labelStyle}>Slug *</label>
                <input
                  type="text"
                  placeholder="absolute-pest-services"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"));
                  }}
                  style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "12px", borderColor: errors.slug ? "var(--negative)" : "var(--border)" }}
                />
                {errors.slug ? (
                  <p style={fieldErrStyle}>{errors.slug}</p>
                ) : (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Used in URLs: /social?client={form.slug || "…"}
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Industry</label>
                <select
                  value={form.industry}
                  onChange={(e) => update("industry", e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">— Select industry —</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input
                    type="email"
                    placeholder="owner@business.com"
                    value={form.contactEmail}
                    onChange={(e) => update("contactEmail", e.target.value)}
                    style={{ ...inputStyle, borderColor: errors.contactEmail ? "var(--negative)" : "var(--border)" }}
                  />
                  {errors.contactEmail && <p style={fieldErrStyle}>{errors.contactEmail}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="(412) 555-1234"
                    value={form.contactPhone}
                    onChange={(e) => update("contactPhone", e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Brand */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Logo URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={form.logoUrl}
                  onChange={(e) => update("logoUrl", e.target.value)}
                  style={inputStyle}
                />
                {form.logoUrl && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logoUrl}
                      alt="Logo preview"
                      style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Logo preview</span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Primary Color</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      style={{ width: "48px", height: "40px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", padding: "2px" }}
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "12px" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Secondary Color</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => update("secondaryColor", e.target.value)}
                      style={{ width: "48px", height: "40px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", padding: "2px" }}
                    />
                    <input
                      type="text"
                      value={form.secondaryColor}
                      onChange={(e) => update("secondaryColor", e.target.value)}
                      style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "12px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Preview swatch */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                  Brand Preview
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Platforms */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Active Platforms *</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {PLATFORMS.map((p) => {
                    const checked = form.platforms.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                          backgroundColor: checked ? "var(--accent-soft)" : "var(--surface)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePlatform(p.id)}
                          style={{ display: "none" }}
                        />
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
                            backgroundColor: checked ? "var(--accent)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.15s ease",
                          }}
                        >
                          {checked && <Check style={{ width: "11px", height: "11px", color: "#fff" }} />}
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: checked ? 600 : 400,
                            color: checked ? "var(--accent)" : "var(--text-secondary)",
                          }}
                        >
                          {p.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.platforms && <p style={fieldErrStyle}>{errors.platforms}</p>}
              </div>

              <div>
                <label style={labelStyle}>Daily Outreach Targets</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px 0" }}>Likes per day</p>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={form.outreachLikes}
                      onChange={(e) => update("outreachLikes", Number(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px 0" }}>Comments per day</p>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={form.outreachComments}
                      onChange={(e) => update("outreachComments", Number(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: "12px",
          }}
        >
          <button
            onClick={step === 0 ? onClose : handleBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {step > 0 && <ChevronLeft style={{ width: "15px", height: "15px" }} />}
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "var(--radius-md)",
                border: "none",
                backgroundColor: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
              }}
            >
              Next
              <ChevronRight style={{ width: "15px", height: "15px" }} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "9px 20px",
                borderRadius: "var(--radius-md)",
                border: "none",
                backgroundColor: "var(--positive)",
                color: "#fff",
                cursor: saving ? "wait" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-heading)",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <>
                  <Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} />
                  Saving…
                </>
              ) : (
                <>
                  <Check style={{ width: "15px", height: "15px" }} />
                  {isEditing ? "Save Changes" : "Create Client"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
