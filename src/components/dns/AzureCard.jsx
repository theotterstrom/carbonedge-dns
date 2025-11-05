import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "./utils";

export function AzureCard(props) {
  const Icon = props.icon;
  return (
    <Card
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/8 bg-[#0e1013]/95 backdrop-blur-sm ring-1 ring-white/10"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_60%)]" />
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="p-2 rounded-xl bg-white/5">
          <Icon className="w-5 h-5 text-white/80" />
        </div>
        <CardTitle className="text-white text-base">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-semibold text-white">{props.value}</div>
        {props.desc && <CardDescription className="text-white/60 mt-1">{props.desc}</CardDescription>}
      </CardContent>
    </Card>
  );
}
