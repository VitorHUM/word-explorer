import { Providers } from "@/components/shared/providers";
import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "Word Explorer",
  description: "Dicionário com busca, histórico e favoritos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={raleway.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
