"use client";

import { useState } from "react";

type SeoPreview = {
  pagesChecked: number;
  errors: number;
  thinPages: number;
  missingTitles: number;
  missingH1: number;
  missingMetaDescriptions: number;
  duplicateTitles: number;
};

export default function HomePage() {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [preview, setPreview] = useState<SeoPreview | null>(null);

  async function handleSeoPreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPreviewLoading(true);
    setPreviewError("");
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("url", previewUrl);

      const response = await fetch("/api/seo-preview", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze website");
      }

      setPreview(data);
    } catch {
      setPreviewError("Failed to analyze website. Try another URL.");
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #0f172a 45%, #111827 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "56px 24px",
      }}
    >
      <section style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          style={{
            color: "#38bdf8",
            fontSize: 14,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          KHANKO.io
        </p>

        <h1
          style={{
            fontSize: 52,
            lineHeight: 1.05,
            margin: 0,
            maxWidth: 820,
          }}
        >
          Extract website content into clean DOCX and XLSX files
        </h1>

        <p
          style={{
            fontSize: 20,
            lineHeight: 1.6,
            color: "#cbd5e1",
            maxWidth: 760,
            marginTop: 22,
          }}
        >
          Crawl website pages, extract readable content, and export structured
          files for translation, SEO audits, AI datasets, and content migration.
        </p>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 16,
            background: "rgba(2, 6, 23, 0.55)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            color: "#cbd5e1",
            maxWidth: 760,
          }}
        >
          Current MVP limits: up to 20 sitemap URLs, same-domain crawling only,
          static + rendered HTML extraction.
        </div>

        <section
          style={{
            marginTop: 36,
            padding: 24,
            borderRadius: 20,
            background: "rgba(15, 23, 42, 0.78)",
            border: "1px solid rgba(148, 163, 184, 0.25)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 26 }}>SEO Preview</h2>

          <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>
            Analyze a website before exporting the full SEO audit spreadsheet.
          </p>

          <form onSubmit={handleSeoPreview}>
            <input
              value={previewUrl}
              onChange={(event) => setPreviewUrl(event.target.value)}
              type="url"
              placeholder="https://example.com"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                borderRadius: 12,
                border: "1px solid #334155",
                background: "#020617",
                color: "white",
                fontSize: 15,
                marginBottom: 12,
              }}
            />

            <button
              type="submit"
              disabled={previewLoading}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: 12,
                border: "none",
                background: previewLoading ? "#64748b" : "#22c55e",
                color: "#020617",
                fontWeight: 700,
                fontSize: 15,
                cursor: previewLoading ? "not-allowed" : "pointer",
              }}
            >
              {previewLoading ? "Analyzing..." : "Analyze Website"}
            </button>
          </form>

          {previewError && (
            <p style={{ color: "#f87171", marginTop: 16 }}>{previewError}</p>
          )}

          {preview && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 12,
                marginTop: 22,
              }}
            >
              <Metric label="Pages checked" value={preview.pagesChecked} />
              <Metric label="Errors" value={preview.errors} />
              <Metric label="Thin pages" value={preview.thinPages} />
              <Metric label="Missing titles" value={preview.missingTitles} />
              <Metric label="Missing H1" value={preview.missingH1} />
              <Metric
                label="Missing meta"
                value={preview.missingMetaDescriptions}
              />
              <Metric
                label="Duplicate titles"
                value={preview.duplicateTitles}
              />
            </div>
          )}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginTop: 40,
          }}
        >
          <ExportCard
            title="DOCX Export"
            description="Create a clean Word document from website pages."
            action="/api/export-docx"
            button="Export DOCX"
          />

          <ExportCard
            title="XLSX Dataset"
            description="Export URL, title, H1, meta description, word count, and content."
            action="/api/export-xlsx"
            button="Export XLSX"
          />

          <ExportCard
            title="Translation XLSX"
            description="Create a translation-ready spreadsheet with Original and Translation columns."
            action="/api/export-translation-xlsx"
            button="Export Translation XLSX"
          />

          <ExportCard
            title="SEO Audit XLSX"
            description="Export page-level SEO checks: titles, H1, meta description, word count, thin pages, and duplicates."
            action="/api/export-seo-audit"
            button="Export SEO Audit"
          />
        </div>

        <div style={{ marginTop: 28, color: "#94a3b8" }}>
          Try examples: https://example.com or https://khanko.tools
        </div>

        <div
          style={{
            marginTop: 44,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <Feature
            title="Sitemap crawling"
            text="Uses sitemap.xml when available."
          />
          <Feature
            title="Clean extraction"
            text="Removes scripts, nav, footer, forms, and noise."
          />
          <Feature
            title="Same-domain only"
            text="Avoids external links and unsafe crawling."
          />
          <Feature
            title="SEO audit mode"
            text="Find thin pages, missing tags, and duplicate page signals."
          />
        </div>

        <footer
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop: "1px solid rgba(148, 163, 184, 0.18)",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          KHANKO.io — Website Content Extraction Platform
        </footer>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "rgba(2, 6, 23, 0.55)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  action,
  button,
}: {
  title: string;
  description: string;
  action: string;
  button: string;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <form
      method="POST"
      action={action}
      onSubmit={() => setLoading(true)}
      style={{
        background: "rgba(15, 23, 42, 0.78)",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
      }}
    >
      <h2 style={{ fontSize: 22, margin: 0 }}>{title}</h2>

      <p
        style={{
          color: "#cbd5e1",
          lineHeight: 1.55,
          minHeight: 96,
        }}
      >
        {description}
      </p>

      <input
        name="url"
        type="url"
        placeholder="https://example.com"
        required
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "13px 14px",
          borderRadius: 12,
          border: "1px solid #334155",
          background: "#020617",
          color: "white",
          fontSize: 15,
          marginBottom: 12,
        }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: 12,
          border: "none",
          background: loading ? "#64748b" : "#38bdf8",
          color: "#020617",
          fontWeight: 700,
          fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Exporting..." : button}
      </button>
    </form>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: "rgba(2, 6, 23, 0.55)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
      <p style={{ color: "#94a3b8", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}
