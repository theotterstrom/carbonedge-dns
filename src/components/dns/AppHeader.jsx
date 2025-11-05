import React from "react";
import { Globe, Plus, RefreshCcw } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@/components/ui";
import { Guard } from "./Guard";
import { Kbd } from "./utils";

export function AppHeader({ role, onRoleChange, onRefresh, onAddDomain }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0c0f]/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <Globe className="w-5 h-5 text-white" />
        <div className="text-white font-semibold">DNS Admin</div>
        <Separator orientation="vertical" className="mx-2 h-6 bg-white/10" />
        <div className="text-white/70 text-sm hidden md:block">Kontrollpanel · Azure-inspirerad</div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-white/60 text-xs">
            <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> Sök
          </div>
          <Select value={role} onValueChange={onRoleChange}>
            <SelectTrigger className="w-[140px] bg-[#0b0e14] border-white/5 text-white/80">
              <SelectValue placeholder="Roll" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" className="text-white/80" onClick={onRefresh}>
            <RefreshCcw className="w-4 h-4 mr-2" /> Uppdatera
          </Button>
          <Guard cap="domains">
            <Button onClick={onAddDomain} className="bg-[#1f2937] hover:bg-[#2a3442] text-white">
              <Plus className="w-4 h-4 mr-2" /> Ny domän
            </Button>
          </Guard>
        </div>
      </div>
    </header>
  );
}
