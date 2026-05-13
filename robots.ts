export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://khanko.io/sitemap.xml",
    host: "https://khanko.io",
  };
}
