export default function HomePage() {
  return (
    <main
      style={{
        padding: 40,
        fontFamily: "Arial, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1>KHANKO.io</h1>

      <p>Website Content Extraction Platform</p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 30,
        }}
      >
        <form method="POST" action="/api/export-docx">
          <input
            name="url"
            type="url"
            placeholder="https://example.com"
            required
            style={{
              width: "100%",
              maxWidth: 600,
              padding: 12,
              fontSize: 16,
              marginBottom: 10,
            }}
          />

          <br />

          <button
            type="submit"
            style={{
              padding: "12px 20px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Export DOCX
          </button>
        </form>

        <form method="POST" action="/api/export-xlsx">
          <input
            name="url"
            type="url"
            placeholder="https://example.com"
            required
            style={{
              width: "100%",
              maxWidth: 600,
              padding: 12,
              fontSize: 16,
              marginBottom: 10,
            }}
          />

          <br />

          <button
            type="submit"
            style={{
              padding: "12px 20px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Export XLSX
          </button>
        </form>
      </div>
    </main>
  );
}
