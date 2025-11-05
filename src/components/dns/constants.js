export const START_DOMAINS = [
  {
    id: "1",
    name: "example.se",
    registrar: "Gandi",
    dnssec: true,
    status: "aktiv",
    createdAt: "2024-12-15",
    records: [
      { id: "r1", type: "A", name: "@", value: "203.0.113.10", ttl: 3600, proxied: false },
      { id: "r2", type: "AAAA", name: "api", value: "2001:db8::42", ttl: 3600, proxied: false },
      { id: "r3", type: "CNAME", name: "www", value: "@", ttl: 300, proxied: true },
      { id: "r4", type: "TXT", name: "@", value: "v=spf1 include:mail.example.se ~all", ttl: 3600 },
      { id: "r5", type: "MX", name: "@", value: "mail.example.se", priority: 10, ttl: 14400 },
      { id: "r6", type: "NS", name: "@", value: "ns1.example.se", ttl: 86400 },
    ],
  },
  {
    id: "2",
    name: "minstartup.io",
    registrar: "Namecheap",
    dnssec: false,
    status: "aktiv",
    createdAt: "2025-03-02",
    records: [
      { id: "r1", type: "A", name: "@", value: "198.51.100.22", ttl: 3600 },
      { id: "r2", type: "TXT", name: "_github-challenge", value: "abc123", ttl: 600 },
      { id: "r3", type: "CNAME", name: "app", value: "gh-pages.github.io", ttl: 300 },
    ],
  },
  {
    id: "3",
    name: "kundprojekt.dev",
    registrar: "Loopia",
    dnssec: true,
    status: "underhåll",
    createdAt: "2025-07-21",
    records: [],
  },
];

export const TYPE_OPTIONS = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "CAA", "SRV", "PTR"];
export const TTL_PRESETS = [300, 600, 900, 1800, 3600, 14400, 86400];
