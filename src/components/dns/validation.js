import { TYPE_OPTIONS } from "./constants";

const ipv4Regex = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const ipv6StrictRegex =
  /^((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){1,7}:)|(([0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,5}(:[0-9A-Fa-f]{1,4}){1,2})|(([0-9A-Fa-f]{1,4}:){1,4}(:[0-9A-Fa-f]{1,4}){1,3})|(([0-9A-Fa-f]{1,4}:){1,3}(:[0-9A-Fa-f]{1,4}){1,4})|(([0-9A-Fa-f]{1,4}:){1,2}(:[0-9A-Fa-f]{1,4}){1,5})|([0-9A-Fa-f]{1,4}:((:[0-9A-Fa-f]{1,4}){1,6}))|(:((:[0-9A-Fa-f]{1,4}){1,7}|:))|(fe80:(:[0-9A-Fa-f]{0,4}){0,4}%[0-9a-zA-Z]{1,})|(::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9]))|(([0-9A-Fa-f]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])))$/;

export function isValidIPv4(s) {
  return ipv4Regex.test(String(s).trim());
}

export function isValidIPv6(s) {
  return ipv6StrictRegex.test(String(s).trim());
}

export function isValidHostname(host) {
  const s = String(host).trim();
  if (!s || s.length > 253) return false;
  const labels = s.split(".");
  for (const label of labels) {
    if (!label) return false;
    if (label.length > 63) return false;
    if (!/^_?[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) return false;
  }
  return true;
}

export function parseZoneLines(text) {
  const lines = String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const records = [];
  for (const line of lines) {
    const [type, name, value, ttl, priority] = line.split(/\s+/);
    if (!TYPE_OPTIONS.includes(type)) continue;
    records.push({
      id: crypto.randomUUID(),
      type,
      name: name || "@",
      value: value || "",
      ttl: ttl ? Number(ttl) : 3600,
      priority: priority ? Number(priority) : undefined,
    });
  }
  return records;
}
