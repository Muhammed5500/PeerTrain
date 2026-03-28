import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeerTrain",
  description: "Decentralized AI Training Verification on Monad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
