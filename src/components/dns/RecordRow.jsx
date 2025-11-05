import React, { useState, useEffect } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useRole, CAN } from "./RoleContext";
import { Guard } from "./Guard";
import { PropagationDialog } from "./PropagationDialog";

export function RecordRow(props) {
  const rec = props.rec;
  const { role } = useRole();
  const [openDiag, setOpenDiag] = useState(false);

  return (
    <div className="grid grid-cols-12 items-center px-3 py-2 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/10">
      <div className="col-span-1 flex items-center">
        <Checkbox
          checked={props.checked}
          onCheckedChange={(v) => props.onChecked(Boolean(v))}
          disabled={!CAN[role].records}
        />
      </div>
      <div className="col-span-2 text-white/90 font-medium">{rec.type}</div>
      <div className="col-span-3 text-white/80 truncate">{rec.name}</div>
      <div className="col-span-3 text-white/70 truncate">{rec.value}</div>
      <div className="col-span-1 text-white/60">{rec.priority || "—"}</div>
      <div className="col-span-2 flex justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="text-white/70" onClick={() => setOpenDiag(true)}>
              <Eye className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Propagation</TooltipContent>
        </Tooltip>
        <Guard cap="records">
          <Button size="icon" variant="ghost" className="text-white/70" onClick={() => props.onEdit(rec)}>
            <Pencil className="w-4 h-4" />
          </Button>
        </Guard>
        <Guard cap="records">
          <Button
            size="icon"
            variant="ghost"
            className="text-red-400 hover:text-red-500"
            onClick={() => props.onDelete(rec)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </Guard>
      </div>
      {openDiag && <PropagationDialog open={openDiag} onOpenChange={setOpenDiag} record={rec} domain={props.domain} />}
    </div>
  );
}
