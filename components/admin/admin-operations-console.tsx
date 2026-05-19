"use client";

import { useState } from "react";
import { Activity, Archive, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type OperationResult = {
  label: string;
  message: string;
};

export function AdminOperationsConsole({ exportPayload }: { exportPayload: Record<string, unknown> }) {
  const [pending, setPending] = useState("");
  const [result, setResult] = useState<OperationResult | null>(null);

  async function runRequest(label: string, path: string, method = "GET") {
    setPending(label);
    try {
      const response = await fetch(path, { method, cache: "no-store" });
      const payload = await response.json();

      setResult({
        label,
        message: response.ok
          ? `${payload.action ?? label} completed at ${payload.timestamp ?? new Date().toISOString()}`
          : payload.error ?? "Operation failed."
      });
    } catch {
      setResult({ label, message: "Operation failed. Check the server log and try again." });
    } finally {
      setPending("");
    }
  }

  function exportSnapshot() {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `admin-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setResult({ label: "Export snapshot", message: "Dashboard snapshot exported." });
  }

  const operations = [
    { label: "Check health", icon: Activity, action: () => runRequest("Check health", "/api/admin/health") },
    { label: "Create backup", icon: Archive, action: () => runRequest("Create backup", "/api/admin/backups", "POST") },
    { label: "Webhook logs", icon: RotateCcw, action: () => runRequest("Webhook logs", "/api/admin/webhooks") },
    { label: "Export snapshot", icon: Download, action: exportSnapshot }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="uppercase">Operations console</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {operations.map((operation) => (
            <Button
              key={operation.label}
              type="button"
              variant="outline"
              className="h-auto justify-start p-4 text-xs font-black uppercase tracking-wide"
              disabled={Boolean(pending)}
              onClick={() => void operation.action()}
            >
              <operation.icon className="size-4 text-[hsl(var(--primary))]" />
              <span>{pending === operation.label ? "Running..." : operation.label}</span>
            </Button>
          ))}
        </div>
        {result ? (
          <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/35 p-3 text-sm">
            <p className="font-medium">{result.label}</p>
            <p className="mt-1 text-[hsl(var(--muted-foreground))]">{result.message}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
