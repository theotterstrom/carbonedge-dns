// Browser-safe polyfill
if (typeof globalThis !== "undefined" && typeof globalThis.process === "undefined") {
  globalThis.process = { env: {} };
}

function getAPIBase() {
  const w = typeof window !== "undefined" ? window : undefined;
  const env = typeof process !== "undefined" && process.env ? process.env : undefined;
  return (w && w.__API_BASE__) || (env && env.API_BASE) || "/api";
}

const API_BASE = getAPIBase();

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "Fel");
    throw new Error(`${res.status} ${res.statusText} – ${txt}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const Api = {
  async listDomains() {
    return api(`/domains`);
  },
  async createDomain(name) {
    return api(`/domains`, { method: "POST", body: { name } });
  },
  async deleteDomain(id) {
    return api(`/domains/${id}`, { method: "DELETE" });
  },
  async listRecords(domainId) {
    return api(`/domains/${domainId}/records`);
  },
  async batch(domainId, ops) {
    return api(`/domains/${domainId}/records:batch`, { method: "POST", body: { ops } });
  },
  async resolve({ name, type, resolvers }) {
    return api(
      `/dns/resolve?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}${
        resolvers ? `&resolvers=${encodeURIComponent(resolvers.join(","))}` : ""
      }`
    );
  },
};
