"use client";
import { useState } from "react";
import { Github, Sparkles, Workflow } from "lucide-react";
import AddAccounts from "@/components/AddAccounts";
import IntegrationProgress from "@/components/IntegrationProgress";
import Dashboard from "@/components/Dashboard";
import OperatorConsole from "@/components/OperatorConsole";
import LaunchedFromBanner from "@/components/LaunchedFromBanner";
import SessionStatus from "@/components/SessionStatus";
import ThemeToggle from "@/components/ThemeToggle";
import ApideckModeBadge from "@/components/ApideckModeBadge";
import { useLaunchParams } from "@/lib/launchParams";
import { useSession } from "@/lib/session";

type Stage = "picker" | "progress" | "dashboard" | "lending";

const STAGES: Array<{ id: Stage; label: string }> = [
  { id: "picker", label: "Pick tools" },
  { id: "progress", label: "Connect & pull" },
  { id: "dashboard", label: "Business health" },
  { id: "lending", label: "Lending view" },
];

export default function Page() {
  const launch = useLaunchParams();
  const { session } = useSession();
  const [stage, setStage] = useState<Stage>("picker");
  const [picks, setPicks] = useState<string[]>([]);

  const reset = () => {
    setStage("picker");
    setPicks([]);
  };

  const canGoTo = (s: Stage) => {
    if (s === "picker") return true;
    if (s === "progress") return picks.length > 0;
    if (s === "dashboard" || s === "lending") return picks.length > 0;
    return false;
  };

  return (
    <main className="gradient-bg min-h-screen">
      <Header
        onReset={reset}
        onLending={() => setStage("lending")}
        showLending={stage === "dashboard"}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Stepper stage={stage} canGoTo={canGoTo} onJump={setStage} />

        <LaunchedFromBanner params={launch} />
        <SessionStatus />

        <div className="animate-fade-up">
          {stage === "picker" && (
            <AddAccounts
              launch={launch}
              onContinue={(p) => {
                setPicks(p);
                setStage("progress");
              }}
            />
          )}

          {stage === "progress" && (
            <IntegrationProgress
              consumerId={
                session?.consumerId ?? launch.consumerId ?? "demo-consumer"
              }
              onFinished={() => setStage("dashboard")}
            />
          )}

          {stage === "dashboard" && (
            <Dashboard
              onReset={reset}
              onLending={() => setStage("lending")}
            />
          )}

          {stage === "lending" && (
            <OperatorConsole onBack={() => setStage("dashboard")} />
          )}
        </div>

        <Footer />
      </div>
    </main>
  );
}

function Header({
  onReset,
  onLending,
  showLending,
}: {
  onReset: () => void;
  onLending: () => void;
  showLending: boolean;
}) {
  return (
    <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 flex items-center justify-between">
      <button
        onClick={onReset}
        className="group inline-flex items-center gap-2.5 select-none"
      >
        <span className="w-7 h-7 rounded-lg bg-ink-900 dark:bg-accent-500 text-white flex items-center justify-center font-bold text-[13px] ring-1 ring-black/20 dark:ring-white/10 group-hover:scale-105 transition">
          A
        </span>
        <div className="text-left">
          <div className="text-[13px] font-semibold leading-none text-ink-900 dark:text-zinc-100">
            Apideck SMB Suite
          </div>
          <div className="text-[10px] leading-none mt-0.5 text-ink-900/60 dark:text-zinc-400">
            Business health &amp; lending · one Vault flow → unified financial feed
          </div>
        </div>
      </button>
      <div className="flex items-center gap-3">
        <ApideckModeBadge />
        {showLending && (
          <button
            onClick={onLending}
            className="inline-flex items-center gap-1.5 text-xs text-ink-900/80 hover:text-ink-900 dark:text-zinc-300 dark:hover:text-zinc-100 px-3 py-1.5 rounded-md ring-1 ring-black/10 dark:ring-white/15 bg-white/40 dark:bg-ink-800/60 backdrop-blur"
          >
            <Workflow className="w-3.5 h-3.5" /> Lending view
          </button>
        )}
        <a
          href="https://github.com/apideck-samples/smb-suite"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-900/70 hover:text-ink-900 dark:text-zinc-300 dark:hover:text-zinc-100 px-3 py-1.5 rounded-md ring-1 ring-black/10 dark:ring-white/15 bg-white/40 dark:bg-ink-800/60 backdrop-blur"
        >
          <Github className="w-3.5 h-3.5" /> Source
        </a>
        <a
          href="https://developers.apideck.com/apis/accounting/reference"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-ink-800 dark:bg-accent-500 dark:hover:bg-accent-600"
        >
          <Sparkles className="w-3.5 h-3.5" /> Read the docs
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}

function Stepper({
  stage,
  canGoTo,
  onJump,
}: {
  stage: Stage;
  canGoTo: (s: Stage) => boolean;
  onJump: (s: Stage) => void;
}) {
  const idx = STAGES.findIndex((s) => s.id === stage);
  return (
    <div className="mb-6 flex items-center gap-2 text-[11px] text-ink-900/70 dark:text-zinc-400 overflow-x-auto pb-1">
      {STAGES.map((s, i) => {
        const done = i < idx;
        const current = i === idx;
        const reachable = canGoTo(s.id);
        return (
          <div key={s.id} className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!reachable || current}
              onClick={() => onJump(s.id)}
              title={
                reachable
                  ? `Jump to ${s.label}`
                  : "Complete the earlier steps first"
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ring-1 transition ${
                current
                  ? "bg-ink-900 dark:bg-accent-500 text-white ring-ink-900 dark:ring-accent-500 cursor-default"
                  : done
                    ? "bg-white/70 dark:bg-ink-800/70 text-ink-900 dark:text-zinc-200 ring-black/10 dark:ring-white/10 hover:bg-white dark:hover:bg-ink-700 hover:ring-black/20"
                    : reachable
                      ? "bg-white/40 dark:bg-ink-800/40 text-ink-900/80 dark:text-zinc-300 ring-black/10 dark:ring-white/10 hover:bg-white/70 dark:hover:bg-ink-800/70"
                      : "bg-white/30 dark:bg-ink-800/30 text-ink-900/60 dark:text-zinc-500 ring-black/10 dark:ring-white/5 cursor-not-allowed opacity-60"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  current
                    ? "bg-white"
                    : done
                      ? "bg-emerald-500"
                      : "bg-ink-900/30 dark:bg-zinc-600"
                }`}
              />
              {i + 1}. {s.label}
            </button>
            {i < STAGES.length - 1 && (
              <span className="w-3 h-px bg-ink-900/20 dark:bg-zinc-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-10 text-center text-[11px] text-ink-900/60 dark:text-zinc-500">
      Built with Next.js · Mirrors the Apideck unified Accounting + Payments APIs
    </footer>
  );
}
