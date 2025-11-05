export function cn(...args) {
  return args.filter(Boolean).join(" ");
}

export function Kbd(props) {
  return (
    <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/70 text-[11px]">
      {props.children}
    </kbd>
  );
}
