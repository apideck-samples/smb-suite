"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import MacWindow from "@/components/MacWindow";
import { useSession } from "@/lib/session";

/**
 * Apply a Vault session from a JWT in the URL.
 *
 * Triggered when the apideck.com samples page redirects users into the live
 * demo with a freshly-minted JWT as /session/<jwt> — we capture it, persist
 * it via the session hook, and bounce to /.
 */
export default function SessionPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { setToken } = useSession();

  useEffect(() => {
    const jwt = params?.token;
    if (typeof jwt === "string" && jwt.length > 0) {
      setToken(jwt);
      router.replace("/?source=apideck-samples");
    }
  }, [params, router, setToken]);

  return (
    <main className="gradient-bg min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-fade-up">
        <MacWindow title="Apideck Vault — applying session">
          <div className="px-8 py-10 text-center">
            <h1 className="text-lg font-semibold text-zinc-50">
              Loading session…
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Hooking up your demo Vault session. This will only take a
              moment.
            </p>
            <div className="mt-6 inline-flex">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse mr-1" />
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        </MacWindow>
      </div>
    </main>
  );
}
