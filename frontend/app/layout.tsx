import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider, Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Faculty DSS",
    template: "%s | Faculty DSS",
  },
  description:
    "Optimization-Based Multi-Criteria Decision Support System for Faculty Recruitment and Multi-Position Allocation.",
  keywords: ["faculty", "recruitment", "DSS", "MCDM", "optimization", "HR"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <ClerkProvider>
          <Show when="signed-out">
            {/* Floating auth strip — only visible on public pages */}
            <div
              style={{
                position: "fixed",
                top: 16,
                right: 20,
                display: "flex",
                gap: 8,
                zIndex: 9999,
              }}
            >
              <SignInButton mode="redirect">
                <button className="btn btn-ghost" style={{ fontSize: 13 }}>
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="redirect">
                <button className="btn btn-primary" style={{ fontSize: 13 }}>
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            {/* UserButton is rendered inside the Header for dashboard pages */}
            <span />
          </Show>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
