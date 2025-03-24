import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./style/globals.css";
import { Toaster } from "./components/ui/toaster";
import { GradientProvider } from "./contexts/GradientContext";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { PageLayout } from "./components/shared/PageLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gradient Generator",
  description: "A minimalist gradient generator with advanced effects",
  keywords: "gradient, generator, color, design, tool",
  authors: [{ name: "Gradient Machine" }],
  openGraph: {
    title: "Gradient Generator",
    description: "A minimalist gradient generator with advanced effects",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ErrorBoundary>
          <GradientProvider>
            <PageLayout>
              {children}
            </PageLayout>
            <Toaster />
          </GradientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
