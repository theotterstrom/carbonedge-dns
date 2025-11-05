import React, { useMemo, useState, useEffect } from "react";
import { Upload, Download, AlertTriangle, Info, Filter, CheckCircle2, Settings, ListFilter } from "lucide-react";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  DomainSidebar,
  RecordsTable,
  RecordForm,
  AzureCard,
  LeftRail,
  AppHeader,
  Guard,
  RoleCtx,
  CAN,
  Api,
  START_DOMAINS,
  parseZoneLines,
  cn,
  Kbd,
} from "@/components/dns";

// Test panel component
function TestPanel() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    import("@/components/dns/validation").then(({ isValidIPv4, isValidIPv6, isValidHostname, parseZoneLines }) => {
      const cases = [
        { name: "IPv4 giltig", run: () => isValidIPv4("203.0.113.10") === true },
        { name: "IPv4 ogiltig (999.1.1.1)", run: () => isValidIPv4("999.1.1.1") === false },
        { name: "IPv4 ogiltig (abc)", run: () => isValidIPv4("abc") === false },
        {
          name: "IPv6 giltig (full)",
          run: () => isValidIPv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334") === true,
        },
        { name: "IPv6 giltig (::1)", run: () => isValidIPv6("::1") === true },
        { name: "IPv6 giltig (IPv4-embedded)", run: () => isValidIPv6("::ffff:192.0.2.128") === true },
        { name: "IPv6 ogiltig (för många ::)", run: () => isValidIPv6("2001:::1") === false },
        { name: "IPv6 ogiltig (icke-hex)", run: () => isValidIPv6("gggg::1") === false },
        { name: "Hostname giltig", run: () => isValidHostname("valid.example.com") === true },
        { name: "Hostname giltig (underscore)", run: () => isValidHostname("_acme-challenge.example.com") === true },
        { name: "Hostname ogiltig (tom label)", run: () => isValidHostname("bad..example.com") === false },
        { name: "Hostname ogiltig (börjar med -)", run: () => isValidHostname("-bad.example.com") === false },
        {
          name: "Hostname ogiltig (label >63)",
          run: () => {
            const long = "a".repeat(64) + ".com";
            return isValidHostname(long) === false;
          },
        },
        {
          name: "parseZoneLines – 2 rader in ⇒ 2 records ut",
          run: () => {
            const txt = "A @ 1.1.1.1 3600\nMX @ mail.example 600 10";
            return parseZoneLines(txt).length === 2;
          },
        },
      ];
      const res = cases.map((c) => ({ name: c.name, ok: !!c.run() }));
      setResults(res);
    });
  }, []);

  const passed = results.filter((r) => r.ok).length;
  const total = results.length;

  return (
    <Card className="mt-4 border border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm">Utvecklartester</CardTitle>
        <CardDescription className="text-white/60">Snabba sanity checks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-white/80 text-sm mb-2">
          {passed}/{total} tester passerade
        </div>
        <ul className="text-white/70 text-sm list-disc pl-5 space-y-1">
          {results.map((r, i) => (
            <li key={i} className={r.ok ? "text-white/70" : "text-red-300"}>
              {r.ok ? "✔" : "✖"} {r.name}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function DnsAdminKontrollpanel() {
  const [domains, setDomains] = useState(START_DOMAINS);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(START_DOMAINS[0].id);
  const selected = useMemo(() => domains.find((d) => d.id === selectedId), [domains, selectedId]);

  // UI state
  const [openRecordSheet, setOpenRecordSheet] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [openZoneDialog, setOpenZoneDialog] = useState(false);
  const [zoneText, setZoneText] = useState("");
  const [compact, setCompact] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Bulk
  const [checkedIds, setCheckedIds] = useState({});
  const checkedList = useMemo(() => Object.entries(checkedIds).filter(([, v]) => v).map(([k]) => k), [checkedIds]);

  // Changeset
  const [changesetOpen, setChangesetOpen] = useState(false);
  const [pendingOps, setPendingOps] = useState([]);

  // Roles
  const [role, setRole] = useState("admin");
  const roleValue = useMemo(() => ({ role, can: (cap) => !!CAN[role][cap] }), [role]);

  // Load from backend if possible
  useEffect(() => {
    (async () => {
      try {
        const ds = await Api.listDomains();
        if (Array.isArray(ds) && ds.length) {
          setDomains(ds);
          setSelectedId(ds[0].id);
        }
      } catch (e) {
        /* keep mock data */
      }
    })();
  }, []);

  // Persist settings
  useEffect(() => {
    const c = localStorage.getItem("dns_compact");
    const f = localStorage.getItem("dns_filter");
    const r = localStorage.getItem("dns_role");
    if (c !== null) setCompact(c === "1");
    if (f) setTypeFilter(f);
    if (r) setRole(r);
  }, []);

  useEffect(() => localStorage.setItem("dns_compact", compact ? "1" : "0"), [compact]);
  useEffect(() => localStorage.setItem("dns_filter", typeFilter), [typeFilter]);
  useEffect(() => localStorage.setItem("dns_role", role), [role]);

  const visibleRecords = useMemo(() => {
    const recs = selected?.records || [];
    if (typeFilter === "ALL") return recs;
    return recs.filter((r) => r.type === typeFilter);
  }, [selected, typeFilter]);

  function stage(op, record, originalId) {
    setPendingOps((ops) => [{ id: crypto.randomUUID(), op, record, originalId }].concat(ops));
  }

  async function addDomain() {
    const name = prompt("Ange domännamn (t.ex. nydomän.se)");
    if (!name) return;
    if (domains.some((d) => d.name === name)) {
      alert("Domänen finns redan");
      return;
    }
    try {
      let newDom = null;
      if (CAN[role].domains) {
        newDom = await Api.createDomain(name);
      }
      newDom = newDom || {
        id: crypto.randomUUID(),
        name,
        registrar: "Okänd",
        dnssec: false,
        status: "aktiv",
        createdAt: new Date().toISOString().slice(0, 10),
        records: [],
      };
      setDomains((ds) => [newDom].concat(ds));
      setSelectedId(newDom.id);
    } catch (e) {
      alert("Misslyckades att skapa domän: " + e.message);
    }
  }

  async function removeDomain(id) {
    if (!CAN[role].deleteDomain) {
      alert("Behörighet saknas");
      return;
    }
    if (!confirm("Ta bort domän? Detta går inte att ångra.")) return;
    try {
      await Api.deleteDomain(id);
    } catch (e) {}
    setDomains((ds) => ds.filter((d) => d.id !== id));
  }

  function upsertRecord(recordOrArray) {
    if (!CAN[role].records) {
      alert("Behörighet saknas");
      return;
    }
    const rows = Array.isArray(recordOrArray) ? recordOrArray : [recordOrArray];
    rows.forEach((r) => {
      if (editRecord && !Array.isArray(recordOrArray)) {
        stage("update", r, editRecord.id);
      } else {
        stage("create", r);
      }
    });
    setEditRecord(null);
    setOpenRecordSheet(false);
  }

  function deleteRecord(rec) {
    if (!CAN[role].records) {
      alert("Behörighet saknas");
      return;
    }
    stage("delete", rec);
  }

  async function applyChanges() {
    if (!CAN[role].publish) {
      alert("Behörighet saknas");
      return;
    }

    setDomains((ds) =>
      ds.map((d) => {
        if (d.id !== selected.id) return d;
        let records = d.records.slice();
        const ops = pendingOps.slice().reverse();
        for (const op of ops) {
          if (op.op === "create") {
            records = [op.record].concat(records);
          } else if (op.op === "update") {
            records = records.map((r) => (r.id === op.originalId ? op.record : r));
          } else if (op.op === "delete") {
            records = records.filter((r) => r.id !== op.record.id);
          }
        }
        return { ...d, records };
      })
    );

    try {
      await Api.batch(selected.id, pendingOps);
    } catch (e) {
      alert("Publicering mot API misslyckades: " + e.message + "\n(ändringarna finns kvar lokalt)");
      return;
    }

    setPendingOps([]);
    setChangesetOpen(false);
    setCheckedIds({});
  }

  function clearChanges() {
    setPendingOps([]);
  }

  function importZone() {
    const parsed = parseZoneLines(zoneText);
    parsed.forEach((r) => stage("create", r));
    setZoneText("");
    setOpenZoneDialog(false);
  }

  function exportZone() {
    const rows = selected.records.map((r) => [r.type, r.name, r.value, r.ttl, r.priority || ""].join("\t"));
    const blob = new Blob([rows.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selected.name + "-zonexport.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const azureBg = "bg-[#0b0b0c]";
  const azurePanel = "bg-[#0e1013]";
  const azureBorder = "border-white/8";

  return (
    <RoleCtx.Provider value={roleValue}>
      <LeftRail />
      <div className={cn("min-h-screen w-full pl-14", azureBg)}>
        <AppHeader role={role} onRoleChange={setRole} onRefresh={() => location.reload()} onAddDomain={addDomain} />

        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 p-4">
          <DomainSidebar
            domains={domains}
            query={query}
            selectedId={selectedId}
            onQueryChange={setQuery}
            onSelectDomain={setSelectedId}
            onAddDomain={addDomain}
            onRemoveDomain={removeDomain}
            azurePanel={azurePanel}
            azureBorder={azureBorder}
          />

          <main className="col-span-12 lg:col-span-9 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/10 text-white/80">{selected?.name}</Badge>
              <Badge variant="secondary" className="bg-white/10 text-white/60">
                {selected?.registrar}
              </Badge>
              {selected?.status !== "aktiv" && (
                <Badge className="bg-yellow-500/20 text-yellow-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {selected.status}
                </Badge>
              )}
              <div className="ml-auto flex items-center gap-3">
                <Guard cap="records">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white/80 bg-transparent hover:bg-white/10"
                    onClick={() => setOpenZoneDialog(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Importera zon
                  </Button>
                </Guard>
                <Button
                  variant="outline"
                  className="border-white/20 text-white/80 bg-transparent hover:bg-white/10"
                  onClick={exportZone}
                >
                  <Download className="w-4 h-4 mr-2" /> Exportera zon
                </Button>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <Switch checked={compact} onCheckedChange={setCompact} /> Kompakt
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] bg-[#0b0e14] border-white/5 text-white/80">
                    <Filter className="w-4 h-4 mr-2" /> <SelectValue placeholder="Filtrera" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Alla typer</SelectItem>
                    {["A", "AAAA", "CNAME", "TXT", "MX", "NS", "CAA", "SRV", "PTR"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="bg-[#1f2937] hover:bg-[#2a3442] text-white"
                  onClick={() => setChangesetOpen(true)}
                  disabled={pendingOps.length === 0}
                >
                  Öppna ändringar ({pendingOps.length})
                </Button>
                <Guard cap="publish">
                  <Button
                    className="bg-emerald-700/70 hover:bg-emerald-700 text-white"
                    onClick={applyChanges}
                    disabled={pendingOps.length === 0}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Publicera
                  </Button>
                </Guard>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <AzureCard
                title="Poster"
                icon={ListFilter}
                value={selected?.records?.length || 0}
                desc="I denna zon"
              />
              <AzureCard title="Skapad" icon={Info} value={selected?.createdAt || ""} />
              <AzureCard title="Status" icon={Settings} value={selected?.status || ""} />
            </div>

            <RecordsTable
              visibleRecords={visibleRecords}
              checkedIds={checkedIds}
              checkedList={checkedList}
              compact={compact}
              selected={selected}
              onCheckedChange={(id, v) =>
                setCheckedIds((m) => {
                  const mm = { ...m };
                  mm[id] = v;
                  return mm;
                })
              }
              onEditRecord={(rec) => {
                setEditRecord(rec);
                setOpenRecordSheet(true);
              }}
              onDeleteRecord={deleteRecord}
              onAddRecord={() => {
                setEditRecord(null);
                setOpenRecordSheet(true);
              }}
              onBulkDelete={() => {
                (selected?.records || [])
                  .filter((r) => checkedList.includes(r.id))
                  .forEach((r) => stage("delete", r));
                setCheckedIds({});
              }}
              onBulkTtl={(ttl) => {
                (selected?.records || [])
                  .filter((r) => checkedList.includes(r.id))
                  .forEach((r) => stage("update", { ...r, ttl }, r.id));
                setCheckedIds({});
              }}
              onBulkProxy={(on) => {
                (selected?.records || [])
                  .filter((r) => checkedList.includes(r.id) && (r.type === "A" || r.type === "CNAME"))
                  .forEach((r) => stage("update", { ...r, proxied: on }, r.id));
                setCheckedIds({});
              }}
              azurePanel={azurePanel}
              azureBorder={azureBorder}
              stage={stage}
            />

            <TestPanel />
          </main>
        </div>

        {openRecordSheet && (
          <Sheet open={openRecordSheet} onOpenChange={setOpenRecordSheet}>
            <SheetContent side="right" className="w-full sm:max-w-md bg-[#0c0f14] text-white border-white/5">
              <SheetHeader>
                <SheetTitle>{editRecord ? "Redigera post" : "Ny DNS-post"}</SheetTitle>
                <SheetDescription className="text-white/60">
                  Stöd för A, AAAA, CNAME, TXT, MX, NS, CAA, SRV, PTR.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4">
                <RecordForm
                  initial={editRecord}
                  onSubmit={upsertRecord}
                  onCancel={() => {
                    setEditRecord(null);
                    setOpenRecordSheet(false);
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}

        {openZoneDialog && (
          <Dialog open={openZoneDialog} onOpenChange={setOpenZoneDialog}>
            <DialogContent className="bg-[#0c0f14] text-white border-white/5">
              <DialogHeader>
                <DialogTitle>Importera zonfil</DialogTitle>
                <DialogDescription className="text-white/60">
                  Klistra in radvis: <Kbd>TYPE</Kbd> <Kbd>NAME</Kbd> <Kbd>VALUE</Kbd> <Kbd>TTL</Kbd> [<Kbd>PRIO</Kbd>]
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={zoneText}
                onChange={(e) => setZoneText(e.target.value)}
                placeholder={"A @ 203.0.113.10 3600\nCNAME www @ 300\nMX @ mail.example.se 14400 10"}
                className="min-h-[200px] bg-[#16181f] border-white/10 text-white"
              />
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setOpenZoneDialog(false)} className="text-white/80">
                  Avbryt
                </Button>
                <Guard cap="records">
                  <Button onClick={importZone} className="bg-[#1f2937] hover:bg-[#2a3442] text-white">
                    <Upload className="w-4 h-4 mr-2" /> Importera
                  </Button>
                </Guard>
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
                {pendingOps.length === 0 ? <div className="text-white/50">Inga väntande ändringar.</div> : null}
                {pendingOps.map((op) => (
                  <div key={op.id} className="rounded-lg border border-white/10 p-3">
                    <div className="text-xs uppercase tracking-wide text-white/50 mb-1">{op.op}</div>
                    <div className="text-white/80 text-sm flex flex-wrap gap-x-3 gap-y-1">
                      <span className="font-mono">{op.record.type}</span>
                      <span className="font-mono">{op.record.name}</span>
                      <span className="font-mono">{op.record.value}</span>
                      {op.record.priority && <span className="font-mono">prio:{op.record.priority}</span>}
                      <span className="font-mono">ttl:{op.record.ttl}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <Button
                  variant="outline"
                  className="border-white/20 text-white/80 bg-transparent hover:bg-white/10"
                  onClick={clearChanges}
                  disabled={pendingOps.length === 0}
                >
                  Rensa
                </Button>
                <Guard cap="publish">
                  <Button
                    className="bg-emerald-700/70 hover:bg-emerald-700 text-white"
                    onClick={applyChanges}
                    disabled={pendingOps.length === 0}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Publicera
                  </Button>
                </Guard>
              </div>
            </SheetContent>
          </Sheet>
        )}

        <footer className="py-6 text-center text-xs text-white/40">
          Byggd som exempel · Mörk grafit/Carbon-lik portal · React + Tailwind + shadcn/ui · API-integrerad & rollstyrd
        </footer>
      </div>
    </RoleCtx.Provider>
  );
}
