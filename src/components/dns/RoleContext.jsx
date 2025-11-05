import React, { createContext, useContext } from "react";

const CAN = {
  admin: { publish: true, domains: true, records: true, deleteDomain: true },
  editor: { publish: true, domains: false, records: true, deleteDomain: false },
  viewer: { publish: false, domains: false, records: false, deleteDomain: false },
};

export const RoleCtx = createContext({
  role: "admin",
  can: function () {
    return true;
  },
});

export function useRole() {
  return useContext(RoleCtx);
}

export { CAN };
