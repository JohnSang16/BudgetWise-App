"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Account = { id: string; name: string; type: string; created_at: string };

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id,name,type,created_at")
        .order("created_at", { ascending: false });

      if (error) setErrorMsg(error.message);
      else setAccounts(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <h2 className="text-lg font-semibold">Accounts</h2>

      {loading && <div className="text-zinc-400">Loading…</div>}
      {errorMsg && <div className="text-red-400">Error: {errorMsg}</div>}

      {!loading && !errorMsg && (
        <ul className="space-y-2">
          {accounts.length === 0 ? (
            <li className="text-zinc-400">No accounts yet.</li>
          ) : (
            accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded bg-zinc-900 text-zinc-100 px-4 py-2"
              >
                <span>{a.name}</span>
                <span className="text-sm text-zinc-400">{a.type}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </main>
  );
}
