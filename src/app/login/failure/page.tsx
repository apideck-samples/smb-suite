"use client";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import MacWindow from "@/components/MacWindow";

export default function Page() {
  return (
    <main className="gradient-bg min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl animate-fade-up">
        <MacWindow title="Connection failed">
          <div className="px-8 py-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/15 ring-1 ring-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-300" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-50 mt-4">
              We couldn&apos;t complete the connection
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Apideck couldn&apos;t establish the bank feed. Common causes:
              the customer cancelled the Vault link, the Xero credentials
              were rejected, or the chosen account is already linked to
              another bank feed connection.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" /> Try again
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-zinc-200 text-sm ring-1 ring-white/5"
              >
                Back to demo home
              </Link>
            </div>
          </div>
        </MacWindow>
      </div>
    </main>
  );
}
