import React, { useState } from "react";
import { Lock, Layers } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/components/ui";
import { useRole, CAN } from "./RoleContext";
import { Guard } from "./Guard";
import { TYPE_OPTIONS, TTL_PRESETS } from "./constants";
import { isValidIPv4, isValidIPv6, isValidHostname } from "./validation";

export function RecordForm(props) {
  const { role } = useRole();
  const initial = props.initial;
  const [type, setType] = useState(initial?.type || "A");
  const [name, setName] = useState(initial?.name || "@");
  const [value, setValue] = useState(initial?.value || "");
  const [ttl, setTtl] = useState(initial?.ttl || 3600);
  const [priority, setPriority] = useState(initial?.priority || "");
  const [proxied, setProxied] = useState(initial?.proxied || false);

  const isCNAME = type === "CNAME";
  const isMX = type === "MX";
  const isA = type === "A";
  const isAAAA = type === "AAAA";
  const apexCname = isCNAME && name === "@";

  function validate() {
    if (!name) return { ok: false, msg: "Namn saknas" };
    if (name !== "@" && !isValidHostname(name)) return { ok: false, msg: "Ogiltigt namn (hostname)" };
    if (!value) return { ok: false, msg: "Värde saknas" };
    if (isA && !isValidIPv4(value)) return { ok: false, msg: "Ogiltig IPv4-adress" };
    if (isAAAA && !isValidIPv6(value)) return { ok: false, msg: "Ogiltig IPv6-adress" };
    if (isCNAME && !isValidHostname(value)) return { ok: false, msg: "CNAME-värde måste vara ett värdnamn" };
    if (isMX) {
      if (priority === "") return { ok: false, msg: "MX kräver prioritet" };
      if (!isValidHostname(value)) return { ok: false, msg: "MX-värde måste vara ett värdnamn" };
    }
    return { ok: true };
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!CAN[role].records) {
      alert("Behörighet saknas");
      return;
    }
    const v = validate();
    if (!v.ok) {
      alert(v.msg);
      return;
    }
    if (apexCname) {
      const ok = confirm("Varning: CNAME på apex (@) är ofta ogiltigt hos registrar/NS. Vill du spara ändå?");
      if (!ok) return;
    }
    props.onSubmit({
      id: initial?.id || crypto.randomUUID(),
      type,
      name,
      value,
      ttl: Number(ttl),
      priority: isMX ? Number(priority) : undefined,
      proxied: isCNAME || isA ? proxied : undefined,
    });
  }

  const templates = [
    {
      name: "SPF (basic)",
      make: (zone) => ({ type: "TXT", name: "@", value: "v=spf1 include:_spf.google.com ~all", ttl: 3600 }),
    },
    {
      name: "DMARC (monitor)",
      make: (zone) => ({ type: "TXT", name: "_dmarc", value: `v=DMARC1; p=none; rua=mailto:dmarc@${zone}`, ttl: 3600 }),
    },
    { name: "Google Workspace MX", make: () => null },
    { name: "Microsoft 365 MX", make: () => null },
    { name: "CNAME www → @", make: () => ({ type: "CNAME", name: "www", value: "@", ttl: 300 }) },
  ];

  function insertTemplate(t) {
    if (!CAN[role].records) {
      alert("Behörighet saknas");
      return;
    }
    if (t.name.includes("MX") && t.make() === null) {
      const mxGoogle = [
        { type: "MX", name: "@", value: "aspmx.l.google.com", priority: 1, ttl: 3600 },
        { type: "MX", name: "@", value: "alt1.aspmx.l.google.com", priority: 5, ttl: 3600 },
        { type: "MX", name: "@", value: "alt2.aspmx.l.google.com", priority: 5, ttl: 3600 },
        { type: "MX", name: "@", value: "alt3.aspmx.l.google.com", priority: 10, ttl: 3600 },
        { type: "MX", name: "@", value: "alt4.aspmx.l.google.com", priority: 10, ttl: 3600 },
      ];
      const mxM365 = [{ type: "MX", name: "@", value: "<tenant>.mail.protection.outlook.com", priority: 0, ttl: 3600 }];
      const rows = t.name.includes("Google") ? mxGoogle : mxM365;
      props.onSubmit(rows.map((r) => ({ id: crypto.randomUUID(), ...r })));
      return;
    }
    const one = t.make("example.test");
    if (one) props.onSubmit([{ id: crypto.randomUUID(), ...one }]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/80">Typ</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-[#0b0e14] border-white/5 text-white/90">
              <SelectValue placeholder="Välj typ" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/80">TTL</Label>
          <Select value={String(ttl)} onValueChange={(v) => setTtl(Number(v))}>
            <SelectTrigger className="bg-[#0b0e14] border-white/5 text-white/90">
              <SelectValue placeholder="Välj TTL" />
            </SelectTrigger>
            <SelectContent>
              {TTL_PRESETS.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  {t} sek
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/80">Namn</Label>
          <Input
            disabled={!CAN[role].records}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#0b0e14] border-white/5 text-white"
            placeholder="@, www, api, _acme-challenge"
          />
        </div>
        <div>
          <Label className="text-white/80">Värde</Label>
          <Input
            disabled={!CAN[role].records}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="bg-[#0b0e14] border-white/5 text-white"
            placeholder={isA ? "203.0.113.10" : isCNAME ? "target.example.se" : "värde"}
          />
        </div>
      </div>

      {isMX && (
        <div>
          <Label className="text-white/80">Prioritet</Label>
          <Input
            disabled={!CAN[role].records}
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-[#0b0e14] border-white/5 text-white"
            placeholder="10"
          />
        </div>
      )}

      {(isA || isCNAME) && (
        <div className="flex items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/80">Proxy (CDN/WAF)</span>
          </div>
          <Switch disabled={!CAN[role].records} checked={proxied} onCheckedChange={setProxied} />
        </div>
      )}

      {apexCname && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-200 text-sm">
          <div className="font-medium mb-1">Varning</div>
          CNAME på apex (<code>@</code>) är ofta ogiltigt beroende på namnserver/registrar. Överväg A/AAAA eller
          ALIAS/ANAME.
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-white/80">Snabbmallar</Label>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <Guard key={t.name} cap="records">
              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-white/80 bg-transparent hover:bg-white/10"
                onClick={() => insertTemplate(t)}
              >
                <Layers className="w-4 h-4 mr-2" /> {t.name}
              </Button>
            </Guard>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={props.onCancel} className="text-white/80">
          Avbryt
        </Button>
        <Guard cap="records">
          <Button type="submit" className="bg-[#1f2937] hover:bg-[#2a3442] text-white">
            Spara
          </Button>
        </Guard>
      </div>
    </form>
  );
}
