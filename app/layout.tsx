import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "США — путешествие 2025",
  description: "Интерактивный архив автомобильного путешествия по США.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
