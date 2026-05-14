import type { Metadata } from "next";
import { Roboto_Flex, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const robotoFlex = Roboto_Flex({ subsets: ["latin"], variable: "--font-roboto-flex" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Digital Twin Engine",
  description: "High-density real-time digital twin simulations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${robotoFlex.variable} ${jetbrainsMono.variable} font-roboto bg-background text-on-surface antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
