"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import MacWindow from "@/components/MacWindow";

function LoginInner() {
  const params = useSearchParams();
  const redirectUri = params.get("redirect_uri") || "";
  const challenge = params.get("challenge") || "";

  return (
    <main className="gradient-bg min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl animate-fade-up">
        <MacWindow title="Apideck Bank Feeds Sync — Redirect target">
          <div className="px-8 py-10">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-6">
              <Lock className="w-3 h-3" />
              <span>
                Apideck redirected the customer here. Show your hosted login,
                then continue the flow.
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-50">
              Continue connecting your bank
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              In production this is the page you configure as your{" "}
              <code className="text-accent-500">redirect_uri</code> in the
              Apideck dashboard. Apideck appends a{" "}
              <code className="text-accent-500">challenge</code> the same way
              the screenshot below shows.
            </p>

            <div className="mt-6 grid gap-2 text-[11px] font-mono">
              <div className="bg-zinc-950 ring-1 ring-white/10 rounded-md px-3 py-2 break-all">
                <span className="text-zinc-500">redirect_uri:</span>{" "}
                <span className="text-zinc-200">
                  {redirectUri || "<not provided>"}
                </span>
              </div>
              <div className="bg-zinc-950 ring-1 ring-white/10 rounded-md px-3 py-2 break-all">
                <span className="text-zinc-500">challenge:</span>{" "}
                <span className="text-zinc-200">
                  {challenge || "<not provided>"}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/login/success?${params.toString()}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium"
              >
                Continue to integration progress
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login/failure"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-ink-700 hover:bg-ink-600 text-zinc-200 text-sm ring-1 ring-white/5"
              >
                Simulate a failure
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-transparent text-zinc-400 hover:text-zinc-200 text-sm"
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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
