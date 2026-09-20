import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { SWRConfig } from "swr";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        dedupingInterval: 5_000,
        focusThrottleInterval: 5_000,
        errorRetryCount: 2,
        errorRetryInterval: 3_000,
        shouldRetryOnError: true,
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SWRConfig>
  </StrictMode>,
);
