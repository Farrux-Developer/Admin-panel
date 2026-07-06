import type { Metadata } from "next";
import "./globals.css";
import { display, sans, mono } from "@/lib/fonts";
import { Cursor } from "@/components/cursor";
import { Toaster } from "@/components/toaster";

export const metadata: Metadata = {
  title: "FOUNDRY — каталог объектов",
  description: "Малосерийные объекты. Каждый экземпляр пронумерован.",
};

const themeInit = `try{if(localStorage.getItem("fdry_theme")==="light")document.documentElement.classList.add("light")}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
        <Cursor />
        <Toaster />
      </body>
    </html>
  );
}
