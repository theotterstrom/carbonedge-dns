import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "bg-slate-900/70 border border-slate-700/70 rounded-2xl shadow-lg",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={cn("p-4 border-b border-slate-700/70", className)} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h2 className={cn("font-semibold text-sm", className)} {...props} />;
}

export function CardDescription({ className = "", ...props }) {
  return <p className={cn("text-xs text-slate-400", className)} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function Button({ variant = "default", className = "", ...props }) {
  const base =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium focus:outline-none focus:ring";
  const variants = {
    default: "bg-sky-600 hover:bg-sky-500 text-white",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-50",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-200",
    outline: "border border-slate-700 text-slate-100 hover:bg-slate-800",
    destructive: "bg-red-600 hover:bg-red-500 text-white"
  };
  return (
    <button
      className={cn(base, variants[variant] || "", className)}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring focus:ring-sky-500/40",
        className
      )}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }) {
  return (
    <label
      className={cn("text-[11px] font-medium text-slate-300", className)}
      {...props}
    />
  );
}

export function Badge({ variant = "default", className = "", ...props }) {
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium";
  const variants = {
    default: "bg-sky-600/90 text-white",
    secondary: "bg-slate-800 text-slate-200",
    outline: "border border-slate-600 text-slate-200"
  };
  return (
    <span className={cn(base, variants[variant] || "", className)} {...props} />
  );
}

export function Select({ children, value, onValueChange }) {
  return (
    <select
      className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs"
      value={value}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
    >
      {children}
    </select>
  );
}
export function SelectTrigger({ children }) { return children; }
export function SelectValue({ children }) { return children; }
export function SelectContent({ children }) { return children; }
export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}

export function Tooltip({ children }) { return children; }
export function TooltipTrigger({ children, ...props }) {
  return <span {...props}>{children}</span>;
}
export function TooltipContent({ children }) {
  return <span className="text-[10px] text-slate-400 ml-1">{children}</span>;
}

export function DropdownMenu({ children }) {
  return <div className="relative inline-flex">{children}</div>;
}
export function DropdownMenuTrigger({ children }) { return children; }
export function DropdownMenuContent({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "absolute right-0 mt-1 min-w-[8rem] rounded-md bg-slate-900 border border-slate-700 shadow-xl z-50 text-xs",
        className
      )}
      {...props}
    />
  );
}
export function DropdownMenuItem({ className = "", ...props }) {
  return (
    <button
      className={cn(
        "w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2",
        className
      )}
      {...props}
    />
  );
}

export function Switch({ checked, onCheckedChange, className = "", ...props }) {
  return (
    <button
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={cn(
        "inline-flex items-center w-9 h-5 rounded-full px-0.5 transition-colors",
        checked ? "bg-sky-500" : "bg-slate-600",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "h-4 w-4 bg-white rounded-full transform transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function Checkbox({ checked, onCheckedChange, className = "", ...props }) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-slate-600 bg-slate-900 text-sky-500",
        className
      )}
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      {...props}
    />
  );
}

export function Separator({ className = "", ...props }) {
  return (
    <div
      className={cn("h-px w-full bg-slate-800 my-2", className)}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring focus:ring-sky-500/40",
        className
      )}
      {...props}
    />
  );
}

export function Dialog({ children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      {children}
    </div>
  );
}
export function DialogContent({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "bg-slate-950 border border-slate-700 rounded-2xl p-4 w-full max-w-lg",
        className
      )}
      {...props}
    />
  );
}
export function DialogHeader({ className = "", ...props }) {
  return <div className={cn("mb-3", className)} {...props} />;
}
export function DialogTitle({ className = "", ...props }) {
  return <h3 className={cn("text-sm font-semibold", className)} {...props} />;
}
export function DialogDescription({ className = "", ...props }) {
  return (
    <p className={cn("text-xs text-slate-400", className)} {...props} />
  );
}
export function DialogFooter({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-end gap-2",
        className
      )}
      {...props}
    />
  );
}

export function Sheet({ children }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
      {children}
    </div>
  );
}
export function SheetContent({ className = "", ...props }) {
  return (
    <div
      className={cn(
        "w-full max-w-md h-full bg-slate-950 border-l border-slate-700 p-4",
        className
      )}
      {...props}
    />
  );
}
export function SheetHeader({ className = "", ...props }) {
  return <div className={cn("mb-3", className)} {...props} />;
}
export function SheetTitle({ className = "", ...props }) {
  return <h3 className={cn("text-sm font-semibold", className)} {...props} />;
}
export function SheetDescription({ className = "", ...props }) {
  return (
    <p className={cn("text-xs text-slate-400", className)} {...props} />
  );
}
