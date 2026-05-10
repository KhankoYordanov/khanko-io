import type { ReactNode } from "react";

export const metadata = {
  title: "KHANKO.io",
  description: "Website Content Extraction Platform",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="K_yA-FEWx20aPJeZle-e8nyNXuIBymum1suOXXBf7KY"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
