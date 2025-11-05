import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { useRole, CAN } from "./RoleContext";

export function Guard(props) {
  const { role } = useRole();
  return CAN[role][props.cap] ? (
    props.children
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block opacity-40 cursor-not-allowed">{props.children}</span>
      </TooltipTrigger>
      <TooltipContent>Behörighet saknas</TooltipContent>
    </Tooltip>
  );
}
