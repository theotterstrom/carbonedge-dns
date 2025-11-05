import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Guard } from "./Guard";
import { RecordRow } from "./RecordRow";
import { BulkBar } from "./BulkBar";
import { cn } from "./utils";

export function RecordsTable({
  visibleRecords,
  checkedIds,
  checkedList,
  compact,
  selected,
  onCheckedChange,
  onEditRecord,
  onDeleteRecord,
  onAddRecord,
  onBulkDelete,
  onBulkTtl,
  onBulkProxy,
  azurePanel,
  azureBorder,
  stage,
}) {
  return (
    <Card className={cn("relative overflow-hidden rounded-2xl border ring-1 ring-white/10 backdrop-blur-sm", azurePanel, azureBorder)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-white">DNS-poster</CardTitle>
            <CardDescription className="text-white/60">
              Hantera A/AAAA, CNAME, MX, TXT, m.fl. med bulk, filter och mallar.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Guard cap="records">
              <Button onClick={onAddRecord} className="bg-[#1f2937] hover:bg-[#2a3442] text-white">
                <Plus className="w-4 h-4 mr-2" /> Lägg till post
              </Button>
            </Guard>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn("grid grid-cols-12 px-3 py-2 text-xs uppercase tracking-wide text-white/50", compact ? "hidden" : "")}
          style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
        >
          <div className="col-span-1">Välj</div>
          <div className="col-span-2">Typ</div>
          <div className="col-span-3">Namn</div>
          <div className="col-span-3">Värde</div>
          <div className="col-span-1">Prio</div>
          <div className="col-span-2 text-right">Åtgärder</div>
        </div>

        <div className="space-y-1">
          {visibleRecords.length === 0 && (
            <div className="p-6 text-center text-white/60">
              Inga poster (filtrerat). Lägg till post eller rensa filter.
            </div>
          )}
          {checkedList.length > 0 && (
            <div className="mb-3">
              <BulkBar
                count={checkedList.length}
                onDelete={onBulkDelete}
                onTtl={onBulkTtl}
                onProxy={onBulkProxy}
              />
            </div>
          )}
          <AnimatePresence initial={false}>
            {visibleRecords.map((rec) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, translateY: 4 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -4 }}
              >
                <RecordRow
                  domain={selected.name}
                  rec={rec}
                  checked={!!checkedIds[rec.id]}
                  onChecked={(v) => onCheckedChange(rec.id, v)}
                  onEdit={onEditRecord}
                  onDelete={onDeleteRecord}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
