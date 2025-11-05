import "./randomuuid-polyfill";
import React from "react";
import ReactDOM from "react-dom/client";
import DnsAdminKontrollpanel from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DnsAdminKontrollpanel />
  </React.StrictMode>
);
