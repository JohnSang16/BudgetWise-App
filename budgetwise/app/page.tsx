"use client";
import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

type Account = { id: string; name: string; type: string; created_at: string };

const TYPES = ["checking", "savings", "cash", "credit"] as const;

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("checking");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id,name,type,created_at")
        .order("created_at", { ascending: false });
      if (error) setErr(error.message);
      setAccounts(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setErr(null);

    // simple client validation
    if (!name.trim()) {
      setErr("Account name is required.");
      return;
    }

    setSubmitting(true);

    // optimistic UI: show immediately
    const tempId = "temp-" + Math.random().toString(36).slice(2);
    const optimistic: Account = {
      id: tempId,
      name: name.trim(),
      type,
      created_at: new Date().toISOString(),
    };
    setAccounts((prev) => [optimistic, ...prev]);

    const { data, error } = await supabase
      .from("accounts")
      .insert([{ name: optimistic.name, type: optimistic.type }])
      .select()
      .single();

    if (error) {
      // rollback optimistic add
      setAccounts((prev) => prev.filter((a) => a.id !== tempId));
      setErr(error.message);
    } else if (data) {
      // replace temp with real row
      setAccounts((prev) => [data as Account, ...prev.filter((a) => a.id !== tempId)]);
      setName("");
      setType("checking");
    }

    setSubmitting(false);
  }

  async function onDelete(id: string) {
    const prev = accounts;
    setAccounts((p) => p.filter((a) => a.id !== id)); // optimistic remove
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      setAccounts(prev); // rollback
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create account</h2>
        <form onSubmit={onCreate} className="flex gap-2 items-center">
          <input
            className="flex-1 rounded bg-zinc-900 text-zinc-100 px-3 py-2"
            placeholder="e.g., Checking"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="rounded bg-zinc-900 text-zinc-100 px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            disabled={submitting}
            className="rounded bg-teal-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </form>
        {err && <div className="text-red-400">{err}</div>}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Accounts</h2>
        {loading ? (
          <div className="text-zinc-400">Loading…</div>
        ) : accounts.length === 0 ? (
          <div className="text-zinc-400">No accounts yet.</div>
        ) : (
          <ul className="space-y-2">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded bg-zinc-900 text-zinc-100 px-4 py-2">
                <span>{a.name} · <span className="text-zinc-400">{a.type}</span></span>
                {!a.id.startsWith("temp-") && (
                  <button onClick={() => onDelete(a.id)} className="text-red-400">Delete</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
