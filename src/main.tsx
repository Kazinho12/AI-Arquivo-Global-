import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./foundation/app/App";
import "./foundation/styles/global.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
