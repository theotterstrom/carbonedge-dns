import React from "react";
import {
  Server,
  Shield,
  Plus,
  Copy,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useRole } from "./RoleContext";
import { Guard } from "./Guard";
import { AzureCard } from "./AzureCard";
import { cn } from "./utils";

export function DomainSidebar({
  domains,
  query,
  selectedId,
  onQueryChange,
  onSelectDomain,
  onAddDomain,
  onRemoveDomain,
  azurePanel,
  azureBorder,
}) {
  return (
    <aside className="col-span-12 lg:col-span-3">
      <Card className={cn("relative overflow-hidden rounded-2xl border ring-1 ring-white/10 backdrop-blur-sm", azurePanel, azureBorder)}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />
        <CardHeader className="pb-3">
          <CardTitle className="text-white">Domäner</CardTitle>
          <CardDescription className="text-white/60">Hantera dina zoner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Sök domän…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="bg-[#0b0e14] border-white/5 text-white"
            />
            <Guard cap="domains">
              <Button onClick={onAddDomain} className="bg-[#1f2937] hover:bg-[#2a3442] text-white" title="Lägg till domän">
                <Plus className="w-4 h-4" />
              </Button>
            </Guard>
          </div>
          <div className="space-y-1 max-h-[55vh] overflow-auto pr-1">
            {domains
              .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
              .map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelectDomain(d.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between",
                    d.id === selectedId
                      ? "bg-white/10 border-[#2a2f3e]"
                      : "bg-transparent border-transparent hover:bg-white/[0.06] hover:border-white/10"
                  )}
                >
                  <div>
                    <div className="text-white/90 font-medium">{d.name}</div>
                    <div className="text-[11px] text-white/50">
                      {d.registrar} · {d.records.length} poster
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.dnssec ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="bg-emerald-500/20 text-emerald-300">DNSSEC</Badge>
                        </TooltipTrigger>
                        <TooltipContent>DNSSEC är aktiverat</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="secondary" className="bg-white/10 text-white/60">
                        DNSSEC av
                      </Badge>
                    )}

                  </div>
                  <button onClick={() => onRemoveDomain(d.id)} style={{ color: 'red', fontWeight: "bold" }}>X</button>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <AzureCard title="Aktiva domäner" icon={Server} value={domains.length} desc="Totalt i kontot" />
        <AzureCard title="DNSSEC på" icon={Shield} value={domains.filter((d) => d.dnssec).length} />
      </div>
    </aside>
  );
}
