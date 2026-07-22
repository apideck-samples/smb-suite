import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session";

export const metadata: Metadata = {
  title: "Apideck SMB Suite — Business Health & Lending",
  description:
    "Apideck unified Accounting + HRIS APIs powering a connected SMB suite: customers pick in-house services or bring their own tools, then one feed drives business-health insights and bank-side underwriting.",
};

// Restore the user's theme choice before React hydrates so we don't flash
// the wrong mode on first paint. Stored value is "light" | "dark"; default
// is "dark" to match the original demo aesthetic.
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('apideck-demo-theme');
    var d = t === 'light' ? false : true;
    document.documentElement.classList.toggle('dark', d);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased text-ink-900 dark:text-zinc-100">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
