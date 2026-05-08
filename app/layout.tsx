import type { ReactNode } from "react";

export const metadata = {
  title: "KHANKO.io",
  description: "Website Content Extraction Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
