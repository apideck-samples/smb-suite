"use client";
// Direct entry point for the integration-progress walkthrough — useful when
// embedding the flow at a stable URL (e.g. as a Vault redirect_uri target).
// The full state machine still lives at /.
import IntegrationProgress from "@/components/IntegrationProgress";

export default function Page() {
  return (
    <main className="gradient-bg min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <IntegrationProgress
          onFinished={() => {
            window.location.href = "/";
          }}
        />
      </div>
    </main>
  );
}
