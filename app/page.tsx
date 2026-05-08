export default function HomePage() {
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
      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
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
        </div>

        <div
          style={{
            marginTop: 44,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <Feature title="Sitemap crawling" text="Uses sitemap.xml when available." />
          <Feature title="Clean extraction" text="Removes scripts, nav, footer, forms, and noise." />
          <Feature title="Same-domain only" text="Avoids external links and unsafe crawling." />
          <Feature title="Business exports" text="Built for translation, SEO, migration, and AI workflows." />
        </div>
      </section>
    </main>
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
  return (
    <form
      method="POST"
      action={action}
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
          minHeight: 74,
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
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: 12,
          border: "none",
          background: "#38bdf8",
          color: "#020617",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        {button}
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
