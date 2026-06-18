import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Architecture Akinator",
  description:
    "Make full-stack architecture choices and watch the app infer what kind of system you've described — with real examples, conflict detection, debugging scenarios, and transformations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
