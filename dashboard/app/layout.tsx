import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";

// Geist ships as its own package (font files bundled locally via next/font/local
// under the hood) rather than through next/font/google -- some Next.js versions'
// bundled Google Fonts metadata don't include Geist yet, so this is the
// official, version-safe way to use it. Inter (a real Google Font) is the
// fallback, per the design system.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "NovaDesk AI — AI customer support that actually knows your business",
  description:
    "NovaDesk AI is an embeddable, multi-tenant AI support chatbot platform. Ground answers in your knowledge base, look up orders, capture leads, and manage every conversation from one dashboard.",
};

// Blocking, pre-hydration theme script: reads localStorage and sets the
// `dark` class on <html> before first paint so there's no flash of the
// wrong theme (default is dark, per the product's design system).
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('novadesk_theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${GeistSans.variable} ${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
