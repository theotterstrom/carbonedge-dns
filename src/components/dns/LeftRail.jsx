import React from "react";
import { Globe, Server, Shield, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";

export function LeftRail() {
  const items = [
    { icon: Globe, label: "Översikt" },
    { icon: Server, label: "Domäner" },
    { icon: Shield, label: "Säkerhet" },
    { icon: Settings, label: "Inställningar" },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-14 border-r border-white/10 bg-[#0b0c0f]/90 backdrop-blur-sm z-40">
      <div className="h-12 border-b border-white/10 flex items-center justify-center">
        <Globe className="w-5 h-5 text-white/80" />
      </div>
      <ul className="py-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="w-full h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.06]">
                    <Icon className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
