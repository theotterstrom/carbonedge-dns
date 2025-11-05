import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button, Input, Switch } from "@/components/ui";
import { useRole, CAN } from "./RoleContext";
import { Guard } from "./Guard";

export function BulkBar(props) {
  const { role } = useRole();
  const [ttl, setTtl] = useState("3600");
  const [proxyOn, setProxyOn] = useState(true);
  const disabled = !CAN[role].records;

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2">
      <div className="text-white/80 text-sm">{props.count} markerade</div>
      <div className="flex items-center gap-2">
        <Input
          disabled={disabled}
          value={ttl}
          onChange={(e) => setTtl(e.target.value)}
          className="h-9 w-28 bg-[#0b0e14] border-white/5 text-white"
        />
        <Guard cap="records">
          <Button
            variant="outline"
            className="border-white/20 text-white/80 bg-transparent hover:bg-white/10"
            onClick={() => props.onTtl(Number(ttl))}
          >
            Sätt TTL
          </Button>
        </Guard>
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <Switch disabled={disabled} checked={proxyOn} onCheckedChange={setProxyOn} />
          <Guard cap="records">
            <Button
              variant="outline"
              className="border-white/20 text-white/80 bg-transparent hover:bg-white/10"
              onClick={() => props.onProxy(proxyOn)}
            >
              Proxy {proxyOn ? "på" : "av"}
            </Button>
          </Guard>
        </div>
        <Guard cap="records">
          <Button className="bg-red-700/70 hover:bg-red-700 text-white" onClick={props.onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Ta bort
          </Button>
        </Guard>
      </div>
    </div>
  );
}
