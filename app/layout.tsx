import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../components/CartProvider";
import { WishlistProvider } from "../components/WishlistProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ANFA ATHLETICS — More Than Athletics",
    template: "%s | ANFA ATHLETICS",
  },
  description:
    "Découvrez ANFA ATHLETICS et FORGED 01 : une vision du sportswear inspirée par le luxe brut, le design industriel et la performance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr-MA"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><CartProvider><WishlistProvider>{children}</WishlistProvider></CartProvider></body>
    </html>
  );
}
