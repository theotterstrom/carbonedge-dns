import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/components/ui";
import { Api } from "./api";

export function PropagationDialog(props) {
  const r = props.record;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await Api.resolve({
        name: r.name === "@" ? props.domain : `${r.name}.${props.domain}`,
        type: r.type,
        resolvers: ["1.1.1.1", "8.8.8.8", "9.9.9.9"],
      });
      setData(res || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (props.open) run();
  }, [props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="bg-[#0c0f14] text-white border-white/5 max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Propagation – {r.type} {r.name}
          </DialogTitle>
          <DialogDescription className="text-white/60">Resultat från flera resolver.</DialogDescription>
        </DialogHeader>
        {loading && <div className="text-white/70">Kör uppslag…</div>}
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
          {data.map((row, i) => (
            <div key={i} className="rounded border border-white/10 p-2">
              <div className="text-xs text-white/60">Resolver: {row.resolver}</div>
              <ul className="text-sm text-white/80 list-disc pl-4">
                {(row.answers || []).map((a, j) => (
                  <li key={j}>
                    {a.data} <span className="text-white/50">(TTL {a.TTL})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {!loading && data.length === 0 && !error && <div className="text-white/60">Inga svar.</div>}
        </div>
        <DialogFooter>
          <Button
            onClick={run}
            variant="outline"
            className="border-white/20 text-white/80 bg-transparent hover:bg-white/10"
          >
            Kör igen
          </Button>
          <Button onClick={() => props.onOpenChange(false)}>Stäng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
