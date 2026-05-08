export default function HomePage() {
  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>KHANKO.io</h1>

      <p>Website Content Extraction Platform</p>

      <form method="POST" action="/api/export-docx">
        <input
          name="url"
          type="url"
          placeholder="https://example.com"
          required
          style={{
            width: "100%",
            maxWidth: 520,
            padding: 12,
            fontSize: 16,
            marginTop: 20,
            marginRight: 10,
          }}
        />

        <button
          type="submit"
          style={{
            padding: "12px 18px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Export DOCX
        </button>
      </form>
    </main>
  );
}
