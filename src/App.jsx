import React, { useMemo, useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Settings,
  Server,
  Globe,
  Plus,
  Upload,
  Download,
  Trash2,
  Pencil,
  Copy,
  ListFilter,
  Eye,
  MoreVertical,
  RefreshCcw,
  AlertTriangle,
  Lock,
  Info,
  Filter,
  Layers,
  CheckCircle2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  Separator,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Checkbox,
} from "@/components/ui";

// --- Browser-safe polyfill to avoid ReferenceError: process is not defined (some libs read process.env) ---
if (typeof globalThis !== "undefined" && typeof globalThis.process === "undefined") {
  // shallow env bag; you can inject values at runtime if needed: window.process.env.API_BASE = "..."
  globalThis.process = { env: {} };
}

// ===================== Konfiguration & API-klient =====================
// VIKTIGT: Undvik Node-specifika globala objekt i browsern (som `process`).
// Denna funktion läser API_BASE från window.__API_BASE__ (om satt), annars från process.env (om den finns), annars '/api'.
function getAPIBase(){
  const w = (typeof window !== "undefined") ? window : undefined;
  const env = (typeof process !== "undefined" && process.env) ? process.env : undefined;
  return (w && w.__API_BASE__) || (env && env.API_BASE) || "/api";
}
const API_BASE = getAPIBase();

async function api(path, { method = "GET", body } = {}){
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok){
    const txt = await res.text().catch(()=>"Fel");
    throw new Error(`${res.status} ${res.statusText} – ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

const Api = {
  async listDomains(){ return api(`/domains`); },
  async createDomain(name){ return api(`/domains`, { method:"POST", body:{ name } }); },
  async deleteDomain(id){ return api(`/domains/${id}`, { method:"DELETE" }); },

  async listRecords(domainId){ return api(`/domains/${domainId}/records`); },
  async batch(domainId, ops){ return api(`/domains/${domainId}/records:batch`, { method:"POST", body:{ ops } }); },

  async resolve({ name, type, resolvers }){ // propagation check
    return api(`/dns/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}${resolvers?`&resolvers=${encodeURIComponent(resolvers.join(','))}`:''}`);
  }
};

// ===================== Hjälpfunktioner =====================
const ipv4Regex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const ipv6StrictRegex = /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){1,7}:)|(([0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,5}(:[0-9A-Fa-f]{1,4}){1,2})|(([0-9A-Fa-f]{1,4}:){1,4}(:[0-9A-Fa-f]{1,4}){1,3})|(([0-9A-Fa-f]{1,4}:){1,3}(:[0-9A-Fa-f]{1,4}){1,4})|(([0-9A-Fa-f]{1,4}:){1,2}(:[0-9A-Fa-f]{1,4}){1,5})|([0-9A-Fa-f]{1,4}:((:[0-9A-Fa-f]{1,4}){1,6}))|(:((:[0-9A-Fa-f]{1,4}){1,7}|:))|(fe80:(:[0-9A-Fa-f]{0,4}){0,4}%[0-9a-zA-Z]{1,})|(::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9]))|(([0-9A-Fa-f]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])))$/;
function isValidIPv4(s){ return ipv4Regex.test(String(s).trim()); }
function isValidIPv6(s){ return ipv6StrictRegex.test(String(s).trim()); }
function isValidHostname(host){
  const s = String(host).trim();
  if (!s || s.length > 253) return false;
  const labels = s.split('.');
  for (const label of labels){
    if (!label) return false;
    if (label.length > 63) return false;
    if (!/^_?[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) return false;
  }
  return true;
}
function parseZoneLines(text){
  const lines = String(text).split("\n").map(l=>l.trim()).filter(Boolean);
  const records = [];
  for (const line of lines){
    const [type,name,value,ttl,priority] = line.split(/\s+/);
    if (!TYPE_OPTIONS.includes(type)) continue;
    records.push({ id: crypto.randomUUID(), type, name: name||"@", value: value||"", ttl: ttl?Number(ttl):3600, priority: priority?Number(priority):undefined });
  }
  return records;
}

// ===================== Dummy-data =====================
const START_DOMAINS = [
  { id:"1", name:"example.se", registrar:"Gandi", dnssec:true, status:"aktiv", createdAt:"2024-12-15", records:[
    { id:"r1", type:"A", name:"@", value:"203.0.113.10", ttl:3600, proxied:false },
    { id:"r2", type:"AAAA", name:"api", value:"2001:db8::42", ttl:3600, proxied:false },
    { id:"r3", type:"CNAME", name:"www", value:"@", ttl:300, proxied:true },
    { id:"r4", type:"TXT", name:"@", value:"v=spf1 include:mail.example.se ~all", ttl:3600 },
    { id:"r5", type:"MX", name:"@", value:"mail.example.se", priority:10, ttl:14400 },
    { id:"r6", type:"NS", name:"@", value:"ns1.example.se", ttl:86400 },
  ]},
  { id:"2", name:"minstartup.io", registrar:"Namecheap", dnssec:false, status:"aktiv", createdAt:"2025-03-02", records:[
    { id:"r1", type:"A", name:"@", value:"198.51.100.22", ttl:3600 },
    { id:"r2", type:"TXT", name:"_github-challenge", value:"abc123", ttl:600 },
    { id:"r3", type:"CNAME", name:"app", value:"gh-pages.github.io", ttl:300 },
  ]},
  { id:"3", name:"kundprojekt.dev", registrar:"Loopia", dnssec:true, status:"underhåll", createdAt:"2025-07-21", records:[] },
];

const TYPE_OPTIONS = ["A","AAAA","CNAME","TXT","MX","NS","CAA","SRV","PTR"];
const TTL_PRESETS = [300,600,900,1800,3600,14400,86400];

function cn(){
  const classes = Array.prototype.slice.call(arguments);
  return classes.filter(Boolean).join(" ");
}
function Kbd(props){ return (<kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/70 text-[11px]">{props.children}</kbd>); }

// ===================== Roll/behörighet =====================
const RoleCtx = createContext({ role:"admin", can: function(){ return true; } });
function useRole(){ return useContext(RoleCtx); }
const CAN = {
  admin: { publish:true, domains:true, records:true, deleteDomain:true },
  editor:{ publish:true, domains:false, records:true, deleteDomain:false },
  viewer:{ publish:false, domains:false, records:false, deleteDomain:false },
};
function Guard(props){
  const { role } = useRole();
  return CAN[role][props.cap] ? props.children : (
    <Tooltip><TooltipTrigger asChild><span className="inline-block opacity-40 cursor-not-allowed">{props.children}</span></TooltipTrigger><TooltipContent>Behörighet saknas</TooltipContent></Tooltip>
  );
}

function AzureCard(props){
  const Icon = props.icon;
  return (
    <Card className={cn("relative overflow-hidden rounded-2xl border border-white/8 bg-[#0e1013]/95 backdrop-blur-sm ring-1 ring-white/10")}> 
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]"/>
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="p-2 rounded-xl bg-white/5"><Icon className="w-5 h-5 text-white/80"/></div>
        <CardTitle className="text-white text-base">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold text-white">{props.value}</div>
        {props.desc ? <CardDescription className="text-white/60 mt-1">{props.desc}</CardDescription> : null}
      </CardContent>
    </Card>
  );
}

function LeftRail(){
  const items = [ {icon:Globe,label:"Översikt"},{icon:Server,label:"Domäner"},{icon:Shield,label:"Säkerhet"},{icon:Settings,label:"Inställningar"} ];
  return (
    <nav className="fixed left-0 top-0 h-full w-14 border-r border-white/10 bg-[#0b0c0f]/90 backdrop-blur-sm z-40">
      <div className="h-12 border-b border-white/10 flex items-center justify-center"><Globe className="w-5 h-5 text-white/80"/></div>
      <ul className="py-2 space-y-1">{items.map(function(item){
        const Icon = item.icon;
        return (
          <li key={item.label}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-full h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06]"><Icon className="w-5 h-5"/></button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          </li>
        );
      })}</ul>
    </nav>
  );
}

// ===================== Propagation/Lookup =====================
function PropagationDialog(props){
  const r = props.record;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]); // [{resolver, answers:[{data,TTL}]}]
  const [error, setError] = useState("");

  async function run(){
    setLoading(true); setError("");
    try{ const res = await Api.resolve({ name: (r.name==="@"? props.domain : `${r.name}.${props.domain}`), type:r.type, resolvers:["1.1.1.1","8.8.8.8","9.9.9.9"] }); setData(res||[]); }
    catch(e){ setError(String(e.message||e)); }
    finally{ setLoading(false); }
  }

  useEffect(function(){ if (props.open) run(); },[props.open]);

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="bg-[#0c0f14] text-white border-white/5 max-w-lg">
        <DialogHeader>
          <DialogTitle>Propagation – {r.type} {r.name}</DialogTitle>
          <DialogDescription className="text-white/60">Resultat från flera resolver.</DialogDescription>
        </DialogHeader>
        {loading? <div className="text-white/70">Kör uppslag…</div> : null}
        {error? <div className="text-red-300 text-sm">{error}</div> : null}
        <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
          {data.map(function(row, i){ return (
            <div key={i} className="rounded border border-white/10 p-2">
              <div className="text-xs text-white/60">Resolver: {row.resolver}</div>
              <ul className="text-sm text-white/80 list-disc pl-4">
                {(row.answers||[]).map(function(a, j){ return (<li key={j}>{a.data} <span className="text-white/50">(TTL {a.TTL})</span></li>); })}
              </ul>
            </div>
          ); })}
          {(!loading && data.length===0 && !error) ? <div className="text-white/60">Inga svar.</div> : null}
        </div>
        <DialogFooter>
          <Button onClick={run} variant="outline" className="border-white/20 text-white/80 bg-transparent hover:bg-white/10">Kör igen</Button>
          <Button onClick={function(){ props.onOpenChange(false); }}>Stäng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordRow(props){
  const rec = props.rec;
  const { role } = useRole();
  const [openDiag, setOpenDiag] = useState(false);
  return (
    <div className="grid grid-cols-12 items-center px-3 py-2 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-white/10">
      <div className="col-span-1 flex items-center"><Checkbox checked={props.checked} onCheckedChange={function(v){props.onChecked(Boolean(v));}} disabled={!CAN[role].records}/></div>
      <div className="col-span-2 text-white/90 font-medium">{rec.type}</div>
      <div className="col-span-3 text-white/80 truncate">{rec.name}</div>
      <div className="col-span-3 text-white/70 truncate">{rec.value}</div>
      <div className="col-span-1 text-white/60">{rec.priority ? rec.priority : "—"}</div>
      <div className="col-span-2 flex justify-end gap-1">
        <Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="text-white/70" onClick={function(){ setOpenDiag(true); }}><Eye className="w-4 h-4"/></Button></TooltipTrigger><TooltipContent>Propagation</TooltipContent></Tooltip>
        <Guard cap="records"><Button size="icon" variant="ghost" className="text-white/70" onClick={function(){props.onEdit(rec);}}><Pencil className="w-4 h-4"/></Button></Guard>
        <Guard cap="records"><Button size="icon" variant="ghost" className="text-red-400 hover:text-red-500" onClick={function(){props.onDelete(rec);}}><Trash2 className="w-4 h-4"/></Button></Guard>
      </div>
      {openDiag ? <PropagationDialog open={openDiag} onOpenChange={setOpenDiag} record={rec} domain={props.domain}/> : null}
    </div>
  );
}

function RecordForm(props){
  const { role } = useRole();
  const initial = props.initial;
  const [type, setType] = useState(initial && initial.type ? initial.type : "A");
  const [name, setName] = useState(initial && initial.name ? initial.name : "@");
  const [value, setValue] = useState(initial && initial.value ? initial.value : "");
  const [ttl, setTtl] = useState(initial && initial.ttl ? initial.ttl : 3600);
  const [priority, setPriority] = useState(initial && initial.priority ? initial.priority : "");
  const [proxied, setProxied] = useState(initial && initial.proxied ? initial.proxied : false);

  const isCNAME = type === "CNAME";
  const isMX = type === "MX";
  const isA = type === "A";
  const isAAAA = type === "AAAA";
  const apexCname = isCNAME && name === "@";

  function validate(){
    if (!name) return { ok:false, msg:"Namn saknas" };
    if (name !== '@' && !isValidHostname(name)) return { ok:false, msg:"Ogiltigt namn (hostname)" };
    if (!value) return { ok:false, msg:"Värde saknas" };
    if (isA && !isValidIPv4(value)) return { ok:false, msg:"Ogiltig IPv4-adress" };
    if (isAAAA && !isValidIPv6(value)) return { ok:false, msg:"Ogiltig IPv6-adress" };
    if (isCNAME && !isValidHostname(value)) return { ok:false, msg:"CNAME-värde måste vara ett värdnamn" };
    if (isMX) {
      if (priority === "") return { ok:false, msg:"MX kräver prioritet" };
      if (!isValidHostname(value)) return { ok:false, msg:"MX-värde måste vara ett värdnamn" };
    }
    return { ok:true };
  }

  function handleSubmit(e){
    e.preventDefault();
    if (!CAN[role].records){ alert("Behörighet saknas"); return; }
    const v = validate();
    if (!v.ok){ alert(v.msg); return; }
    if (apexCname){ var ok = confirm("Varning: CNAME på apex (@) är ofta ogiltigt hos registrar/NS. Vill du spara ändå?"); if (!ok) return; }
    props.onSubmit({ id: initial && initial.id ? initial.id : crypto.randomUUID(), type: type, name: name, value: value, ttl: Number(ttl), priority: isMX ? Number(priority):undefined, proxied: (isCNAME||isA)?proxied:undefined });
  }

  var templates = [
    { name:"SPF (basic)", make:function(zone){ return { type:"TXT", name:"@", value:"v=spf1 include:_spf.google.com ~all", ttl:3600 }; } },
    { name:"DMARC (monitor)", make:function(zone){ return { type:"TXT", name:"_dmarc", value:"v=DMARC1; p=none; rua=mailto:dmarc@" + zone, ttl:3600 }; } },
    { name:"Google Workspace MX", make:function(){ return null; } },
    { name:"Microsoft 365 MX", make:function(){ return null; } },
    { name:"CNAME www → @", make:function(){ return { type:"CNAME", name:"www", value:"@", ttl:300 }; } },
  ];

  function insertTemplate(t){
    if (!CAN[role].records){ alert("Behörighet saknas"); return; }
    if (t.name.indexOf("MX") !== -1 && t.make() === null){
      var mxGoogle = [
        { type:"MX", name:"@", value:"aspmx.l.google.com", priority:1, ttl:3600 },
        { type:"MX", name:"@", value:"alt1.aspmx.l.google.com", priority:5, ttl:3600 },
        { type:"MX", name:"@", value:"alt2.aspmx.l.google.com", priority:5, ttl:3600 },
        { type:"MX", name:"@", value:"alt3.aspmx.l.google.com", priority:10, ttl:3600 },
        { type:"MX", name:"@", value:"alt4.aspmx.l.google.com", priority:10, ttl:3600 },
      ];
      var mxM365 = [ { type:"MX", name:"@", value:"<tenant>.mail.protection.outlook.com", priority:0, ttl:3600 } ];
      var rows = t.name.indexOf("Google") !== -1 ? mxGoogle : mxM365;
      props.onSubmit(rows.map(function(r){ return { id: crypto.randomUUID(), type:r.type, name:r.name, value:r.value, priority:r.priority, ttl:r.ttl }; }));
      return;
    }
    var one = t.make("example.test");
    if (one) props.onSubmit([{ id: crypto.randomUUID(), type:one.type, name:one.name, value:one.value, ttl:one.ttl }]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/80">Typ</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-[#0b0e14] border-white/5 text-white/90"><SelectValue placeholder="Välj typ"/></SelectTrigger>
            <SelectContent>{TYPE_OPTIONS.map(function(t){ return (<SelectItem key={t} value={t}>{t}</SelectItem>); })}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/80">TTL</Label>
          <Select value={String(ttl)} onValueChange={function(v){ setTtl(Number(v)); }}>
            <SelectTrigger className="bg-[#0b0e14] border-white/5 text-white/90"><SelectValue placeholder="Välj TTL"/></SelectTrigger>
            <SelectContent>{TTL_PRESETS.map(function(t){ return (<SelectItem key={t} value={String(t)}>{t} sek</SelectItem>); })}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white/80">Namn</Label>
          <Input disabled={!CAN[role].records} value={name} onChange={function(e){ setName(e.target.value); }} className="bg-[#0b0e14] border-white/5 text-white" placeholder="@, www, api, _acme-challenge"/>
        </div>
        <div>
          <Label className="text-white/80">Värde</Label>
          <Input disabled={!CAN[role].records} value={value} onChange={function(e){ setValue(e.target.value); }} className="bg-[#0b0e14] border-white/5 text-white" placeholder={isA?"203.0.113.10":(isCNAME?"target.example.se":"värde")}/>
        </div>
      </div>

      {isMX ? (
        <div>
          <Label className="text-white/80">Prioritet</Label>
          <Input disabled={!CAN[role].records} type="number" value={priority} onChange={function(e){ setPriority(e.target.value); }} className="bg-[#0b0e14] border-white/5 text-white" placeholder="10"/>
        </div>
      ) : null}

      {(isA||isCNAME) ? (
        <div className="flex items-center justify-between rounded-lg border border-white/10 p-3 bg-white/5">
          <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-white/60"/><span className="text-sm text-white/80">Proxy (CDN/WAF)</span></div>
          <Switch disabled={!CAN[role].records} checked={proxied} onCheckedChange={setProxied}/>
        </div>
      ) : null}

      {apexCname ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-200 text-sm">
          <div className="font-medium mb-1">Varning</div>
          CNAME på apex (<code>@</code>) är ofta ogiltigt beroende på namnserver/registrar. Överväg A/AAAA eller ALIAS/ANAME. Du kan ändå spara via bekräftelsen.
        </div>
      ) : null}

      <div className="space-y-2">
        <Label className="text-white/80">Snabbmallar</Label>
        <div className="flex flex-wrap gap-2">
          {templates.map(function(t){ return (
            <Guard key={t.name} cap="records">
              <Button type="button" variant="outline" className="border-white/20 text-white/80 bg-transparent hover:bg-white/10" onClick={function(){ insertTemplate(t); }}>
                <Layers className="w-4 h-4 mr-2"/> {t.name}
              </Button>
            </Guard>
          ); })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={props.onCancel} className="text-white/80">Avbryt</Button>
        <Guard cap="records"><Button type="submit" className="bg-[#1f2937] hover:bg-[#2a3442] text-white">Spara</Button></Guard>
      </div>
    </form>
  );
}

function BulkBar(props){
  const { role } = useRole();
  const [ttl, setTtl] = useState("3600");
  const [proxyOn, setProxyOn] = useState(true);
  const disabled = !CAN[role].records;
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2">
      <div className="text-white/80 text-sm">{props.count} markerade</div>
      <div className="flex items-center gap-2">
        <Input disabled={disabled} value={ttl} onChange={function(e){ setTtl(e.target.value); }} className="h-9 w-28 bg-[#0b0e14] border-white/5 text-white"/>
        <Guard cap="records"><Button variant="outline" className="border-white/20 text-white/80 bg-transparent hover:bg-white/10" onClick={function(){ props.onTtl(Number(ttl)); }}>Sätt TTL</Button></Guard>
        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
          <Switch disabled={disabled} checked={proxyOn} onCheckedChange={setProxyOn}/>
          <Guard cap="records"><Button variant="outline" className="border-white/20 text-white/80 bg-transparent hover:bg-white/10" onClick={function(){ props.onProxy(proxyOn); }}>Proxy {proxyOn?"på":"av"}</Button></Guard>
        </div>
        <Guard cap="records"><Button className="bg-red-700/70 hover:bg-red-700 text-white" onClick={props.onDelete}><Trash2 className="w-4 h-4 mr-2"/>Ta bort</Button></Guard>
      </div>
    </div>
  );
}

function TestPanel(){
  const [results, setResults] = useState([]);
  useEffect(function(){
    const cases = [];
    cases.push({ name:'IPv4 giltig', run:function(){ return isValidIPv4('203.0.113.10')===true; } });
    cases.push({ name:'IPv4 ogiltig (999.1.1.1)', run:function(){ return isValidIPv4('999.1.1.1')===false; } });
    cases.push({ name:'IPv4 ogiltig (abc)', run:function(){ return isValidIPv4('abc')===false; } });
    cases.push({ name:'IPv6 giltig (full)', run:function(){ return isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')===true; } });
    cases.push({ name:'IPv6 giltig (::1)', run:function(){ return isValidIPv6('::1')===true; } });
    cases.push({ name:'IPv6 giltig (IPv4-embedded)', run:function(){ return isValidIPv6('::ffff:192.0.2.128')===true; } });
    cases.push({ name:'IPv6 ogiltig (för många ::)', run:function(){ return isValidIPv6('2001:::1')===false; } });
    cases.push({ name:'IPv6 ogiltig (icke-hex)', run:function(){ return isValidIPv6('gggg::1')===false; } });
    cases.push({ name:'Hostname giltig', run:function(){ return isValidHostname('valid.example.com')===true; } });
    cases.push({ name:'Hostname giltig (underscore)', run:function(){ return isValidHostname('_acme-challenge.example.com')===true; } });
    cases.push({ name:'Hostname ogiltig (tom label)', run:function(){ return isValidHostname('bad..example.com')===false; } });
    cases.push({ name:'Hostname ogiltig (börjar med -)', run:function(){ return isValidHostname('-bad.example.com')===false; } });
    // Nya testfall
    cases.push({ name:'Hostname ogiltig (label >63)', run:function(){ var long = 'a'.repeat(64)+'.com'; return isValidHostname(long)===false; } });
    cases.push({ name:'parseZoneLines – 2 rader in ⇒ 2 records ut', run:function(){ var txt = 'A @ 1.1.1.1 3600\nMX @ mail.example 600 10'; return parseZoneLines(txt).length===2; } });
    const res = cases.map(function(c){ return { name:c.name, ok: !!c.run() }; });
    setResults(res);
  },[]);
  const passed = results.filter(function(r){ return r.ok; }).length; const total = results.length;
  return (
    <Card className="mt-4 border border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Utvecklartester</CardTitle><CardDescription className="text-white/60">Snabba sanity checks</CardDescription></CardHeader>
      <CardContent>
        <div className="text-white/80 text-sm mb-2">{passed}/{total} tester passerade</div>
        <ul className="text-white/70 text-sm list-disc pl-5 space-y-1">{results.map(function(r,i){ return (<li key={i} className={r.ok?"text-white/70":"text-red-300"}>{r.ok?'✔':'✖'} {r.name}</li>); })}</ul>
      </CardContent>
    </Card>
  );
}

export default function DnsAdminKontrollpanel(){
  const [domains, setDomains] = useState(START_DOMAINS);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(START_DOMAINS[0].id);
  const selected = useMemo(function(){ return domains.find(function(d){ return d.id===selectedId; }); }, [domains, selectedId]);

  // UI state
  const [openRecordSheet, setOpenRecordSheet] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [openZoneDialog, setOpenZoneDialog] = useState(false);
  const [zoneText, setZoneText] = useState("");
  const [compact, setCompact] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Bulk
  const [checkedIds, setCheckedIds] = useState({});
  const checkedList = useMemo(function(){ return Object.entries(checkedIds).filter(function(e){ return e[1]; }).map(function(e){ return e[0]; }); }, [checkedIds]);

  // Changeset
  const [changesetOpen, setChangesetOpen] = useState(false);
  const [pendingOps, setPendingOps] = useState([]);

  // Roles (demo: byt roll i topbaren)
  const [role, setRole] = useState("admin");
  const roleValue = useMemo(function(){ return { role:role, can:function(cap){ return !!CAN[role][cap]; } }; },[role]);

  // Load från backend om möjligt
  useEffect(function(){
    (async function(){
      try{ const ds = await Api.listDomains(); if (Array.isArray(ds) && ds.length){ setDomains(ds); setSelectedId(ds[0].id); } }
      catch(e){ /* behåll mock-data */ }
    })();
  },[]);

  // Persist settings
  useEffect(function(){ const c = localStorage.getItem('dns_compact'); const f = localStorage.getItem('dns_filter'); const r = localStorage.getItem('dns_role'); if (c!==null) setCompact(c==='1'); if (f) setTypeFilter(f); if (r) setRole(r); },[]);
  useEffect(function(){ localStorage.setItem('dns_compact', compact?'1':'0'); },[compact]);
  useEffect(function(){ localStorage.setItem('dns_filter', typeFilter); },[typeFilter]);
  useEffect(function(){ localStorage.setItem('dns_role', role); },[role]);

  const visibleRecords = useMemo(function(){
    const recs = selected && selected.records ? selected.records : [];
    if (typeFilter==='ALL') return recs;
    return recs.filter(function(r){ return r.type===typeFilter; });
  },[selected, typeFilter]);

  function stage(op, record, originalId){ setPendingOps(function(ops){ return [{ id: crypto.randomUUID(), op: op, record: record, originalId: originalId },].concat(ops); }); }

  async function addDomain(){
    const name = prompt("Ange domännamn (t.ex. nydomän.se)");
    if (!name) return;
    if (domains.some(function(d){ return d.name===name; })) { alert("Domänen finns redan"); return; }
    try{
      let newDom = null;
      if (CAN[role].domains){ newDom = await Api.createDomain(name); }
      newDom = newDom || { id: crypto.randomUUID(), name: name, registrar:"Okänd", dnssec:false, status:"aktiv", createdAt: (new Date()).toISOString().slice(0,10), records: [] };
      setDomains(function(ds){ return [newDom].concat(ds); }); setSelectedId(newDom.id);
    }catch(e){ alert("Misslyckades att skapa domän: " + e.message); }
  }

  async function removeDomain(id){ if (!CAN[role].deleteDomain){ alert("Behörighet saknas"); return; } if (!confirm("Ta bort domän? Detta går inte att ångra.")) return; try{ await Api.deleteDomain(id); }catch(e){} setDomains(function(ds){ return ds.filter(function(d){ return d.id!==id; }); }); }

  function upsertRecord(recordOrArray){
    if (!CAN[role].records){ alert("Behörighet saknas"); return; }
    const rows = Array.isArray(recordOrArray) ? recordOrArray : [recordOrArray];
    rows.forEach(function(r){ if (editRecord && !Array.isArray(recordOrArray)) stage('update', r, editRecord.id); else stage('create', r); });
    setEditRecord(null); setOpenRecordSheet(false);
  }
  function deleteRecord(rec){ if (!CAN[role].records){ alert("Behörighet saknas"); return; } stage('delete', rec); }

  async function applyChanges(){
    if (!CAN[role].publish){ alert("Behörighet saknas"); return; }
    setDomains(function(ds){ return ds.map(function(d){
      if (d.id!==selected.id) return d;
      var records = d.records.slice();
      var ops = pendingOps.slice().reverse();
      for (var i=0;i<ops.length;i++){
        var op = ops[i];
        if (op.op==='create'){ records = [op.record].concat(records); }
        else if (op.op==='update'){ records = records.map(function(r){ return r.id===op.originalId ? op.record : r; }); }
        else if (op.op==='delete'){ records = records.filter(function(r){ return r.id!==op.record.id; }); }
      }
      return { id:d.id, name:d.name, registrar:d.registrar, dnssec:d.dnssec, status:d.status, createdAt:d.createdAt, records: records };
    }); });

    try{ await Api.batch(selected.id, pendingOps); }
    catch(e){ alert("Publicering mot API misslyckades: " + e.message + "\n(ändringarna finns kvar lokalt)"); return; }

    setPendingOps([]); setChangesetOpen(false); setCheckedIds({});
  }
  function clearChanges(){ setPendingOps([]); }

  function importZone(){ const parsed = parseZoneLines(zoneText); parsed.forEach(function(r){ stage('create', r); }); setZoneText(""); setOpenZoneDialog(false); }
  function exportZone(){ const rows = selected.records.map(function(r){ return [r.type,r.name,r.value,r.ttl,(r.priority? r.priority : "")].join("\t"); }); const blob = new Blob([rows.join("\n")],{type:"text/plain;charset=utf-8"}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download= selected.name + "-zonexport.txt"; a.click(); URL.revokeObjectURL(url); }

  const azureBg = "bg-[#0b0b0c]"; const azurePanel = "bg-[#0e1013]"; const azureBorder = "border-white/8";

  return (
    <RoleCtx.Provider value={roleValue}>
      <LeftRail/>
      <div className={cn("min-h-screen w-full pl-14", azureBg)}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0c0f]/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <Globe className="w-5 h-5 text-white"/>
            <div className="text-white font-semibold">DNS Admin</div>
            <Separator orientation="vertical" className="mx-2 h-6 bg-white/10"/>
            <div className="text-white/70 text-sm hidden md:block">Kontrollpanel · Azure-inspirerad</div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 text-white/60 text-xs"><Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> Sök</div>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[140px] bg-[#0b0e14] border-white/5 text-white/80"><SelectValue placeholder="Roll"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" className="text-white/80" onClick={function(){ location.reload(); }}><RefreshCcw className="w-4 h-4 mr-2"/> Uppdatera</Button>
              <Guard cap="domains"><Button onClick={addDomain} className="bg-[#1f2937] hover:bg-[#2a3442] text-white"><Plus className="w-4 h-4 mr-2"/> Ny domän</Button></Guard>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 p-4">
          <aside className="col-span-12 lg:col-span-3">
            <Card className={cn("relative overflow-hidden rounded-2xl border ring-1 ring-white/10 backdrop-blur-sm", azurePanel, azureBorder)}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]"/>
              <CardHeader className="pb-3">
                <CardTitle className="text-white">Domäner</CardTitle>
                <CardDescription className="text-white/60">Hantera dina zoner</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Sök domän…" value={query} onChange={function(e){ setQuery(e.target.value); }} className="bg-[#0b0e14] border-white/5 text-white"/>
                  <Guard cap="domains"><Button onClick={addDomain} className="bg-[#1f2937] hover:bg-[#2a3442] text-white" title="Lägg till domän"><Plus className="w-4 h-4"/></Button></Guard>
                </div>
                <div className="space-y-1 max-h-[55vh] overflow-auto pr-1">
                  {domains.filter(function(d){ return d.name.toLowerCase().indexOf(query.toLowerCase())!==-1; }).map(function(d){ return (
                    <button key={d.id} onClick={function(){ setSelectedId(d.id); }} className={cn("w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between", d.id===selectedId?"bg-white/10 border-[#2a2f3e]":"bg-transparent border-transparent hover:bg-white/[0.06] hover:border-white/10")}> 
                      <div>
                        <div className="text-white/90 font-medium">{d.name}</div>
                        <div className="text-[11px] text-white/50">{d.registrar} · {d.records.length} poster</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {d.dnssec ? (<Tooltip><TooltipTrigger asChild><Badge className="bg-emerald-500/20 text-emerald-300">DNSSEC</Badge></TooltipTrigger><TooltipContent>DNSSEC är aktiverat</TooltipContent></Tooltip>) : (<Badge variant="secondary" className="bg-white/10 text-white/60">DNSSEC av</Badge>)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="text-white/70"><MoreVertical className="w-4 h-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={function(){ navigator.clipboard.writeText(d.name); }}><Copy className="w-4 h-4 mr-2"/> Kopiera namn</DropdownMenuItem>
                            <Guard cap="deleteDomain"><DropdownMenuItem onClick={function(){ removeDomain(d.id); }} className="text-red-500 focus:text-red-600"><Trash2 className="w-4 h-4 mr-2"/> Ta bort</DropdownMenuItem></Guard>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </button>
                  ); })}
                </div>
              </CardContent>
            </Card>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <AzureCard title="Aktiva domäner" icon={Server} value={domains.length} desc="Totalt i kontot"/>
              <AzureCard title="DNSSEC på" icon={Shield} value={domains.filter(function(d){ return d.dnssec; }).length}/>
            </div>
          </aside>

          <main className="col-span-12 lg:col-span-9 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 text-white/80">{selected ? selected.name : ''}</Badge>
              <Badge variant="secondary" className="bg-white/10 text-white/60">{selected ? selected.registrar : ''}</Badge>
              {selected && selected.status!=="aktiv" ? (<Badge className="bg-yellow-500/20 text-yellow-300 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {selected.status}</Badge>) : null}
              <div className="ml-auto flex items-center gap-3">
                <Guard cap="records"><Button variant="outline" className="border-white/20 text-white/80 bg-transparent hover:bg-white/10" onClick={function(){ setOpenZoneDialog(true); }}><Upload className="w-4 h-4 mr-2"/> Importera zon</Button></Guard>
                <Button variant="outline" className="border-white/20 text-white/80 bg-transparent hover:bg-white/10" onClick={exportZone}><Download className="w-4 h-4 mr-2"/> Exportera zon</Button>
                <div className="flex items-center gap-2 text-white/70 text-xs"><Switch checked={compact} onCheckedChange={setCompact}/> Kompakt</div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] bg-[#0b0e14] border-white/5 text-white/80"><Filter className="w-4 h-4 mr-2"/> <SelectValue placeholder="Filtrera"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Alla typer</SelectItem>
                    {TYPE_OPTIONS.map(function(t){ return (<SelectItem key={t} value={t}>{t}</SelectItem>); })}
                  </SelectContent>
                </Select>
                <Button className="bg-[#1f2937] hover:bg-[#2a3442] text-white" onClick={function(){ setChangesetOpen(true); }} disabled={pendingOps.length===0}>Öppna ändringar ({pendingOps.length})</Button>
                <Guard cap="publish"><Button className="bg-emerald-700/70 hover:bg-emerald-700 text-white" onClick={applyChanges} disabled={pendingOps.length===0}><CheckCircle2 className="w-4 h-4 mr-2"/>Publicera</Button></Guard>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <AzureCard title="Poster" icon={ListFilter} value={selected && selected.records ? selected.records.length : 0} desc="I denna zon"/>
              <AzureCard title="Skapad" icon={Info} value={selected ? selected.createdAt : ''}/>
              <AzureCard title="Status" icon={Settings} value={selected ? selected.status : ''}/>
            </div>

            <Card className={cn("relative overflow-hidden rounded-2xl border ring-1 ring-white/10 backdrop-blur-sm", azurePanel, azureBorder)}>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]"/>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-white">DNS-poster</CardTitle>
                    <CardDescription className="text-white/60">Hantera A/AAAA, CNAME, MX, TXT, m.fl. med bulk, filter och mallar.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Guard cap="records"><Button onClick={function(){ setEditRecord(null); setOpenRecordSheet(true); }} className="bg-[#1f2937] hover:bg-[#2a3442] text-white"><Plus className="w-4 h-4 mr-2"/> Lägg till post</Button></Guard>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn("grid grid-cols-12 px-3 py-2 text-xs uppercase tracking-wide text-white/50", compact?"hidden":"")} style={{ gridTemplateColumns:"repeat(12, minmax(0, 1fr))" }}>
                  <div className="col-span-1">Välj</div>
                  <div className="col-span-2">Typ</div>
                  <div className="col-span-3">Namn</div>
                  <div className="col-span-3">Värde</div>
                  <div className="col-span-1">Prio</div>
                  <div className="col-span-2 text-right">Åtgärder</div>
                </div>

                <div className="space-y-1">
                  {visibleRecords.length===0 ? (<div className="p-6 text-center text-white/60">Inga poster (filtrerat). Lägg till post eller rensa filter.</div>) : null}
                  {checkedList.length>0 ? (
                    <div className="mb-3"><BulkBar count={checkedList.length} onDelete={function(){ (selected && selected.records ? selected.records : []).filter(function(r){ return checkedList.indexOf(r.id)!==-1; }).forEach(function(r){ stage('delete', r); }); setCheckedIds({}); }} onTtl={function(ttl){ (selected && selected.records ? selected.records : []).filter(function(r){ return checkedList.indexOf(r.id)!==-1; }).forEach(function(r){ stage('update', { id:r.id, type:r.type, name:r.name, value:r.value, ttl:ttl, priority:r.priority, proxied:r.proxied }, r.id); }); setCheckedIds({}); }} onProxy={function(on){ (selected && selected.records ? selected.records : []).filter(function(r){ return checkedList.indexOf(r.id)!==-1 && (r.type==='A' || r.type==='CNAME'); }).forEach(function(r){ stage('update', { id:r.id, type:r.type, name:r.name, value:r.value, ttl:r.ttl, priority:r.priority, proxied:on }, r.id); }); setCheckedIds({}); }}/></div>
                  ) : null}
                  <AnimatePresence initial={false}>
                    {visibleRecords.map(function(rec){ return (
                      <motion.div key={rec.id} initial={{opacity:0, translateY:4}} animate={{opacity:1, translateY:0}} exit={{opacity:0, translateY:-4}}>
                        <RecordRow domain={selected.name} rec={rec} checked={!!checkedIds[rec.id]} onChecked={function(v){ setCheckedIds(function(m){ var mm = Object.assign({}, m); mm[rec.id] = v; return mm; }); }} onEdit={function(r){ setEditRecord(r); setOpenRecordSheet(true); }} onDelete={deleteRecord}/>
                      </motion.div>
                    ); })}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>

            <TestPanel/>
          </main>
        </div>

        {openRecordSheet && (
          <Sheet open={openRecordSheet} onOpenChange={setOpenRecordSheet}>
            <SheetContent side="right" className="w-full sm:max-w-md bg-[#0c0f14] text-white border-white/5">
              <SheetHeader>
                <SheetTitle>{editRecord?"Redigera post":"Ny DNS-post"}</SheetTitle>
                <SheetDescription className="text-white/60">Stöd för A, AAAA, CNAME, TXT, MX, NS, CAA, SRV, PTR.</SheetDescription>
              </SheetHeader>
              <div className="mt-4"><RecordForm initial={editRecord?editRecord:undefined} onSubmit={upsertRecord} onCancel={function(){ setEditRecord(null); setOpenRecordSheet(false); }}/></div>
            </SheetContent>
          </Sheet>
        )}

        {openZoneDialog && (
          <Dialog open={openZoneDialog} onOpenChange={setOpenZoneDialog}>
            <DialogContent className="bg-[#0c0f14] text-white border-white/5">
              <DialogHeader>
                <DialogTitle>Importera zonfil</DialogTitle>
                <DialogDescription className="text-white/60">Klistra in radvis: <Kbd>TYPE</Kbd> <Kbd>NAME</Kbd> <Kbd>VALUE</Kbd> <Kbd>TTL</Kbd> [<Kbd>PRIO</Kbd>]</DialogDescription>
              </DialogHeader>
              <Textarea value={zoneText} onChange={function(e){ setZoneText(e.target.value); }} placeholder={"A @ 203.0.113.10 3600\nCNAME www @ 300\nMX @ mail.example.se 14400 10"} className="min-h-[200px] bg-[#16181f] border-white/10 text-white"/>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={function(){ setOpenZoneDialog(false); }} className="text-white/80">Avbryt</Button>
                <Guard cap="records"><Button onClick={function(){ importZone(); }} className="bg-[#1f2937] hover:bg-[#2a3442] text-white"><Upload className="w-4 h-4 mr-2"/> Importera</Button></Guard>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {changesetOpen && (
          <Sheet open={changesetOpen} onOpenChange={setChangesetOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md bg-[#0c0f14] text-white border-white/5">
              <SheetHeader>
                <SheetTitle>Ändringar</SheetTitle>
                <SheetDescription className="text-white/60">Granska innan publicering</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2 max-h-[75vh] overflow-auto pr-1">
                {pendingOps.length===0 ? <div className="text-white/50">Inga väntande ändringar.</div> : null}
                {pendingOps.map(function(op){ return (
                  <div key={op.id} className="rounded-lg border border-white/10 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/50 mb-1">{op.op}</div>
                    <div className="text-white/80 text-sm flex flex-wrap gap-x-3 gap-y-1">
                      <span className="font-mono">{op.record.type}</span>
                      <span className="font-mono">{op.record.name}</span>
                      <span className="font-mono">{op.record.value}</span>
                      {typeof op.record.priority!=="undefined" ? <span className="font-mono">prio:{op.record.priority}</span> : null}
                      <span className="font-mono">ttl:{op.record.ttl}</span>
                    </div>
                  </div>
                ); })}
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <Button variant="outline" className="border-white/20 text-white/80 bg-transparent hover:bg-white/10" onClick={clearChanges} disabled={pendingOps.length===0}>Rensa</Button>
                <Guard cap="publish"><Button className="bg-emerald-700/70 hover:bg-emerald-700 text-white" onClick={applyChanges} disabled={pendingOps.length===0}><CheckCircle2 className="w-4 h-4 mr-2"/>Publicera</Button></Guard>
              </div>
            </SheetContent>
            <button onClick={() => setChangesetOpen(false)}> Close </button>
          </Sheet>
        )}

        <footer className="py-6 text-center text-xs text-white/40">Byggd som exempel · Mörk grafit/Carbon-lik portal · React + Tailwind + shadcn/ui · API-integrerad & rollstyrd</footer>
      </div>
    </RoleCtx.Provider>
  );
}
